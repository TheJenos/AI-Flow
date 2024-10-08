import NewNode from "../node_utils/new_node";
import { Card } from "../ui/card";
import { Toggle } from "../ui/toggle";
import { PlayCircle, Scan, StopCircle } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { AppContext, getNodeDetails, nodeDetails, NodeState } from "@/lib/nodes";
import { getOutgoers, useReactFlow } from "@xyflow/react";
import { cloneDeep, set } from "lodash";
import { AppNode, useFlowStore, useRuntimeStore } from "@/lib/store";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Controllers() {
  const { toast } = useToast()
  const { nodes, edges, updateNode } = useFlowStore(useShallow(s => ({
    nodes: s.nodes,
    edges: s.edges,
    updateNode: s.updateNode
  })));

  const { isRunning, start, stop, increaseInToken, increaseOutToken, increaseAmount} = useRuntimeStore(useShallow(s => ({
    isRunning: s.isRunning,
    start: s.start,
    stop: s.stop,
    log: s.log,
    increaseInToken: s.increaseInToken,
    increaseOutToken: s.increaseOutToken,
    increaseAmount: s.increaseAmount,
  })));

  const reactFlow = useReactFlow();

  const updateNodeState = (node: AppNode, state: NodeState, context?: AppContext) => {
    const clonedNode = cloneDeep(node);
    set(clonedNode, 'data.state', state);
    if (context) set(context,`${node.id}.state`, state)
    updateNode(clonedNode);
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
    const context = {};
    const startNode = nodes.find((node: AppNode) => node.type === 'start');
    if (!startNode) return;
    start();
    const controller = {
      log: console.log,
      increaseInToken,
      increaseOutToken,
      increaseAmount
    }

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
      nodes.forEach((node: AppNode) => {
        updateNodeState(node, 'idle');
      });
    }, 3000);
  }

  useEffect(() => {
    nodes.forEach((node: AppNode) => {
      updateNodeState(node, 'idle');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card className="absolute top-2 left-1/2 -translate-x-1/2 p-1 flex gap-1 z-50">
      <NewNode />
      <Toggle onClick={() => reactFlow.fitView({
        padding: 0.3
      })} >
        <Scan/>
      </Toggle>
      <Toggle pressed={isRunning} onClick={isRunning ? stop : startWrapper}>
        {isRunning ? <StopCircle size={20} /> : <PlayCircle size={20} />}
      </Toggle>
    </Card>
  );
}