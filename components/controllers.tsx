import useFlowStore, { AppNode } from "@/lib/store";
import NewNode from "./new_node";
import { Card } from "./ui/card";
import { Toggle } from "./ui/toggle";
import { PlayCircle, StopCircle } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { getNodeDetails, NodeState } from "@/lib/nodes";
import { getOutgoers } from "@xyflow/react";
import { cloneDeep, set } from "lodash";

export default function Controllers() {
  const { isRunning, start, stop, nodes, edges, updateNode } = useFlowStore(useShallow(s => ({
    nodes: s.nodes,
    edges: s.edges,
    isRunning: s.isRunning,
    start: s.start,
    stop: s.stop,
    updateNode: s.updateNode
  })));

  const updateNodeState = (node: AppNode, state: NodeState) => {
    const clonedNode = cloneDeep(node);
    set(clonedNode, 'data.state', state);
    updateNode(clonedNode);
  }

  const startWrapper = async () => {
    if (isRunning) return;
    let context = {};
    const startNode = nodes.find((node: AppNode) => node.type === 'start');
    if (!startNode) return;
    start();

    const makeAllNodesWaiting = (node: AppNode, path: string[] = []) => {
      if (path.includes(node.id)) return;
      updateNodeState(node, 'waiting');
      const outgoers = getOutgoers(node, nodes, edges);
      path.push(node.id);
      outgoers.forEach((outgoer) => makeAllNodesWaiting(outgoer, path));
    }

    const processNode = async (node: AppNode): Promise<void> => {
      const isRunning = useFlowStore.getState().isRunning;
      if (!isRunning) return;
      const details = getNodeDetails(node.type as string);

      updateNodeState(node, 'running');
      context = await details.process(context, node);
      updateNodeState(node, 'completed');

      const outgoers = getOutgoers(node, nodes, edges);
      if (outgoers.length === 0) return;

      if (node.type === 'multi_thread') {
        await Promise.all(outgoers.map(processNode));
      } else {
        if (outgoers.length > 1) {
          throw new Error('Only Multi Tread nodes can have more than one outgoing connection');
        }
        await processNode(outgoers[0]);
      }
    };

    makeAllNodesWaiting(startNode);
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
      <Toggle pressed={isRunning} onClick={isRunning ? stop : startWrapper}>
        {isRunning ? <StopCircle size={20} /> : <PlayCircle size={20} />}
      </Toggle>
    </Card>
  );
}