import * as StartNode from "@/components/nodes/start";
import * as PromptNode from "@/components/nodes/prompt";
import * as MultiTreadNode from "@/components/nodes/multi_thread";
import * as TreadMergeNode from "@/components/nodes/thread_merge";

export type NodeState = 'idle' | 'waiting' | 'running' | 'completed' | 'failed';

export type NodeMetaData = {
    type: string;
    name: string;
    description: string;
    notAddable?: boolean;
}

type NodeDetails = NodeMetaData & {
    node: typeof StartNode.Node;
    properties: typeof StartNode.Properties;
    process: typeof StartNode.Process;
}

const nodes = [
    StartNode,
    PromptNode,
    MultiTreadNode,
    TreadMergeNode
];

export const nodeDetails: NodeDetails[] = nodes.map(x => ({
    ...x.Metadata,
    node: x.Node,
    properties: x.Properties,
    process: x.Process
}));

export const nodeTypes = Object.fromEntries(nodeDetails.map(node => [node.type, node.node]));

export const getNodeDetails = (type: string) => {
    const node = nodeDetails.find(node => node.type === type);
    if (!node) {    
        throw new Error(`Node with type ${type} not found`);
    }
    return node;
}
