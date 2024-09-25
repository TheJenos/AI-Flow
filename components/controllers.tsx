import useFlowStore, { AppNode } from "@/lib/store";
import NewNode from "./new_node";
import { Card } from "./ui/card";
import { Toggle } from "./ui/toggle";
import { PlayCircle, StopCircle } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { getNodeDetails } from "@/lib/nodes";
import { getOutgoers } from "@xyflow/react";

export default function Controllers() {
  const { isRunning, start, stop, nodes, edges } = useFlowStore(useShallow(s => ({
    nodes: s.nodes,
    edges: s.edges,
    isRunning: s.isRunning,
    start: s.start,
    stop: s.stop
  })));

  const startWrapper = async () => {
    if (isRunning) return;
    let context = {};
    const startNode = nodes.find((node: AppNode) => node.type === 'start');
    if (!startNode) return;
    start();

    const processNode = async (node: AppNode): Promise<void> => {
      const details = getNodeDetails(node.type as string);
      context = await details.process(context, node);

      const outgoers = getOutgoers(node, nodes, edges);
      await Promise.all(outgoers.map(processNode));
    };

    await processNode(startNode);

    stop();
  }

  return (
    <Card className="absolute top-2 left-1/2 -translate-x-1/2 p-1 flex gap-1 z-50">
      <NewNode />
      <Toggle onClick={isRunning ? stop : startWrapper}>
        {isRunning ? <StopCircle size={20} /> : <PlayCircle size={20} />}
      </Toggle>
    </Card>
  );
}