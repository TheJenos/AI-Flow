import * as StartNode from "@/components/nodes/start";
import * as PromptNode from "@/components/nodes/prompt";
import * as MultiTreadNode from "@/components/nodes/multi_thread";
import * as TreadMergeNode from "@/components/nodes/thread_merge";
import * as DecisionNode from "@/components/nodes/decision";
import * as ConsoleLogNode from "@/components/nodes/console_log";
import * as LocalRAGNode from "@/components/nodes/local_rag";
import * as SetStateNode from "@/components/nodes/set_state";

import { AppNode, NodeLogs, UpdatePayload } from "./stores/flow_store";
import Decimal from "decimal.js-light";
import { Edge } from "@xyflow/react";

export type NodeType = "start" | 
"prompt" | 
"multi_thread" | 
"thread_merge" | 
"decision" | 
"console_log" | 
"local_rag" | 
"set_state"

const nodes = [
    StartNode,
    PromptNode,
    MultiTreadNode,
    TreadMergeNode,
    DecisionNode,
    ConsoleLogNode,
    LocalRAGNode,
    SetStateNode
];

export type NodeState = 'idle' | 'faded' | 'waiting' | 'running' | 'completed' | 'failed';

export type OutputExtra =  {
    [key: string] : string | number | object | unknown | undefined
}

export type AppContext = {
    [key: string]: {
        [key: string] : string | number | object | undefined
    }
}

export type Controller = {
    log: <T=unknown>(payload:NodeLogs<T>) => void;
    increaseInToken: (amount: number) => void;
    increaseOutToken: (amount: number) => void;
    increaseAmount:(amount: Decimal) => void;
}

export type NodeOutput = {
    [key: string]: {
        title: string
        description?: string
        value?: string | number 
    }
}

export type NodeLogViewProps<T = unknown> = {
    node?: AppNode;
    payload: T
}

export type NodeLogView = (props: NodeLogViewProps) => JSX.Element
export type NodeOutputs = ( node: AppNode, extra: OutputExtra ) => NodeOutput
export type NodeProcess = (context: AppContext, node: AppNode, nextNodes: AppNode[], Controller: Controller) => Promise<AppNode[]>

export type NodeConnectDisconnectPayload = {
    nodes: AppNode[]
    edges: Edge[]
    sourceNode: AppNode
    targetNode: AppNode
    connectedEdge?: Edge 
}
export type NodeOnConnectDisconnect = (payload: NodeConnectDisconnectPayload, updates: UpdatePayload) => Promise<void>

export type NodeMetaData<T = unknown> = {
    type: NodeType;
    name: string;
    description: string;
    tags: string[],
    notAddable?: boolean;
    defaultData?: T,
    valueIdentifier?: (node: AppNode) => string;
    OnConnect?: NodeOnConnectDisconnect;
    OnDisconnect?: NodeOnConnectDisconnect;
}

export type NodeDetails = NodeMetaData & {
    node: typeof StartNode.Node;
    properties: typeof StartNode.Properties;
    process: NodeProcess;
    outputs?: NodeOutputs;
    logView?: NodeLogView;
}

export const nodeMetaDetails = nodes.map(x => x.Metadata);

export const nodeDetails: NodeDetails[] = nodes.map(x => ({
    ...(x.Metadata as unknown as NodeMetaData),
    node: x.Node,
    properties: x.Properties,
    process: x.Process,
    outputs: 'Outputs' in x ? x.Outputs as NodeOutputs : undefined,
    logView: 'LogView' in x ? x.LogView as NodeLogView : undefined
} as NodeDetails));

export const nodeMap = Object.fromEntries(nodeDetails.map(node => [node.type, node.node]));

export const getNodeDetails = (type: NodeType) => {
    const node = nodeDetails.find(node => node.type === type);
    if (!node) {    
        throw new Error(`Node with type ${type} not found`);
    }
    return node;
}
