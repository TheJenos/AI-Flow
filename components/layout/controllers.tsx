import NewNode from "../node_utils/new_node";
import { Card } from "../ui/card";
import { Play, Scan, Square } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { AppContext, Controller, getNodeDetails, NodeState } from "@/lib/nodes";
import { getOutgoers, useReactFlow } from "@xyflow/react";
import { set } from "lodash";
import { AppNode, useFlowStore, useRuntimeStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import UndoRedo from "../node_utils/undo_redo";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export default function Controllers() {
  const { toast } = useToast()
  const { nodes, edges, clearSelection } = useFlowStore(useShallow(s => ({
    nodes: s.nodes,
    edges: s.edges,
    clearSelection: s.clearSelection
  })))

  const { isRunning, start, stop, log, increaseInToken, increaseOutToken, increaseAmount, setNodeState, setNodeStateFromNodeId} = useRuntimeStore(useShallow(s => ({
    isRunning: s.isRunning,
    start: s.start,
    stop: s.stop,
    log: s.log,
    increaseInToken: s.increaseInToken,
    increaseOutToken: s.increaseOutToken,
    increaseAmount: s.increaseAmount,
    setNodeState: s.setNodeState,
    setNodeStateFromNodeId: s.setNodeStateFromNodeId,
  })));

  const reactFlow = useReactFlow();

  const updateNodeState = (node: AppNode, state: NodeState, context?: AppContext) => {
    setNodeStateFromNodeId(node.id, state);
    if (context) set(context,`${node.id}.state`, state)
  }

  const makeAllNodesState = (node: AppNode, state: NodeState, context?: AppContext, path: string[] = []) => {
    if (path.includes(node.id)) return;
    updateNodeState(node, state, context);
    const outgoers = getOutgoers(node, nodes, edges);
    path.push(node.id);
    outgoers.forEach((outgoer) => makeAllNodesState(outgoer, state,context, path));
  }

  const startWrapper = async () => {
    if (isRunning) return;
    clearSelection()
    const context = {};
    const startNode = nodes.find((node: AppNode) => node.type === 'start');
    if (!startNode) return;
    start();
    const controller = {
      log,
      increaseInToken,
      increaseOutToken,
      increaseAmount
    } as Controller

    const processNode = async (node: AppNode): Promise<void> => {
      const isRunning = useRuntimeStore.getState().isRunning;
      if (!isRunning) return;
      const details = getNodeDetails(node.type);
      const currentState = useFlowStore.getState().nodes.find(x => x.id == node.id)
      if (currentState && currentState.data.state == 'running') return;

      const outgoers = getOutgoers(node, nodes, edges);

      let next = []

      try {
        updateNodeState(node, 'running', context);
        next = await details.process(context, node, outgoers, controller);
        updateNodeState(node, 'completed', context);
      } catch (error) {
        console.log(error);

        controller.log({
          id: node.id,
          nodeType: node.type,
          type: 'error',
          title: (error as Error).message,
        })
        
        toast({
          title: `Something went wrong on ${node.data.name || details.name}`,
          description: (error as Error).message,
          duration: 3000
        })

        updateNodeState(node, 'failed', context);
        outgoers.forEach(x => makeAllNodesState(x,'failed', context))
        return;
      }
      
      await Promise.all(next.map(processNode));
    };

    makeAllNodesState(startNode, 'waiting', context);
    await processNode(startNode);

    stop();
    setTimeout(() => {
      setNodeState(Object.fromEntries(nodes.map(x => [x.id, 'idle'])))
    }, 3000);
  }

  return (
    <>
      <Card className="absolute top-2 left-1/2 -translate-x-1/2 p-1 flex gap-1 z-50">
        <UndoRedo/>
        <NewNode />
        <Button toolTip="Fit in view" variant={'ghost'} size={'icon'} onClick={() => reactFlow.fitView({
          padding: 0.3,
          duration: 300
        })} >
          <Scan/>
        </Button>
      </Card>
      <div className={cn("rounded-full p-2 absolute right-2 bottom-2 z-50 shadow-md h-16 w-16 flex items-center justify-center", isRunning ? "bg-red-500" : "bg-green-500")} >
        <Button className="rounded-full h-14 w-14 bg-transparent hover:bg-transparent p-2" variant="ghost" toolTip={isRunning ? "Stop" : "Play"} onClick={isRunning ? stop : startWrapper}>
          {isRunning ? <Square className="stroke-white" size={32} /> : <Play className="stroke-white" size={32} />}
        </Button>
      </div>
    </>
  );
}