import NewNode from "./new_node";
import { Card } from "./ui/card";
import { Toggle } from "./ui/toggle";
import { PlayCircle, Scan, StopCircle } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { getNodeDetails, NodeState } from "@/lib/nodes";
import { getOutgoers, useReactFlow } from "@xyflow/react";
import { cloneDeep, set } from "lodash";
import { AppNode, useFlowStore, useRuntimeStore } from "@/lib/store";

export default function Controllers() {
  const { nodes, edges, updateNode } = useFlowStore(useShallow(s => ({
    nodes: s.nodes,
    edges: s.edges,
    updateNode: s.updateNode
  })));

  const { isRunning, start, stop} = useRuntimeStore(useShallow(s => ({
    isRunning: s.isRunning,
    start: s.start,
    stop: s.stop
  })));

  const reactFlow = useReactFlow();

  const updateNodeState = (node: AppNode, state: NodeState) => {
    const clonedNode = cloneDeep(node);
    set(clonedNode, 'data.state', state);
    updateNode(clonedNode);
  }

  const startWrapper = async () => {
    if (isRunning) return;
    const context = {};
    const startNode = nodes.find((node: AppNode) => node.type === 'start');
    if (!startNode) return;
    start();

    const makeAllNodesState = (node: AppNode, state: NodeState, path: string[] = []) => {
      if (path.includes(node.id)) return;
      updateNodeState(node, state);
      const outgoers = getOutgoers(node, nodes, edges);
      path.push(node.id);
      outgoers.forEach((outgoer) => makeAllNodesState(outgoer, state, path));
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
        updateNodeState(node, 'running');
        next = await details.process(context, node, outgoers);
        updateNodeState(node, 'completed');
      } catch (error) {
        console.log(error);
        updateNodeState(node, 'failed');
        outgoers.forEach(x => makeAllNodesState(x,'failed'))
        return;
      }
      
      await Promise.all(next.map(processNode));
    };

    makeAllNodesState(startNode, 'waiting');
    await processNode(startNode);

    stop();
    setTimeout(() => {
      nodes.forEach((node: AppNode) => {
        updateNodeState(node, 'idle');
      });
    }, 3000);
  }

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