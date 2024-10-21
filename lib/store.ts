import { create, useStore } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, getOutgoers, NodeProps, getIncomers } from '@xyflow/react';
import { createComputed } from "zustand-computed";
import { persist, createJSONStorage } from 'zustand/middleware';
import { Edge, Node, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { getNodeDetails, NodeState, NodeType } from './nodes';
import Decimal from 'decimal.js-light';
import { temporal, TemporalState } from 'zundo';
import { debounce, merge } from 'lodash';
import { deepEqual } from 'fast-equals';

export type NodeData = {
    thread: string
    name?: string
    parentId?: string
}

export type UpdatePayload = {
    edges: { [key: string]: Partial<Edge> | null },
    nodes: { [key: string]: Partial<AppNode> | null }
}

export type AppNodeProp = NodeProps & {
    data: NodeData
}

export type AppNode<T = NodeData> = Node & {
    type: NodeType
    data: T
};

export type NodeLogs<T = unknown> = {
    id: string
    type: 'info' | 'success' | 'error' | 'warning'
    title: string
    nodeType: NodeType
    payload?: T
}

export type AppState = {
    nodes: AppNode[];
    edges: Edge[];
    onNodesChange: OnNodesChange<AppNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    pushNode: (node: AppNode) => void;
    setNodes: (nodes: AppNode[]) => void;
    setEdges: (edges: Edge[]) => void;
    updateNode: (updatedNode: AppNode) => void;
    updateEdge: (updatedEdge: Edge) => void;
    clearSelection: () => void;
};

export type RuntimeState = {
    isRunning: boolean;
    nodeStates: {
        [key: string]: NodeState
    }
    logs: NodeLogs[];
    startTime?: number,
    endTime?: number,
    inToken: number;
    outToken: number;
    amount: number;
    start: () => void;
    stop: () => void;
    log: (payload: NodeLogs) => void;
    setNodeState: (nodeStates: { [key: string]: NodeState }) => void;
    setNodeStateFromNodeId: (nodeId: string, state: NodeState) => void;
    increaseInToken: (amount: number) => void;
    increaseOutToken: (amount: number) => void;
    increaseAmount: (amount: Decimal) => void;
    setInToken: (inToken: number) => void;
    setOutToken: (outToken: number) => void;
    setAmount: (amount: number) => void;
};

export type DevMode = {
    testOpenAPI: boolean;
    showTreads: boolean;
    showPropData: boolean;
}

export type SettingsState = {
    openAIKey: string;
    devMode?: DevMode;
    setOpenAIKey: (key: string) => void;
    setDevMode: (value?: DevMode) => void;
};

export const useSettingStore = create<SettingsState>()(persist(set => ({
    openAIKey: '',
    devMode: undefined,
    setOpenAIKey: key => set({ openAIKey: key }),
    setDevMode: value => set({ devMode: value }),
}), {
    name: 'flow-setting-store',
    storage: createJSONStorage(() => localStorage)
}));

export const useRuntimeStore = create<RuntimeState>()(set => ({
    isRunning: false,
    nodeStates: {},
    logs: [],
    startTime: undefined,
    endTime: undefined,
    duration: 0,
    inToken: 0,
    outToken: 0,
    amount: 0,
    start: () => set({ isRunning: true, startTime: new Date().getTime(), endTime: undefined, inToken: 0, outToken: 0, amount: 0, logs: [] }),
    stop: () => set({ isRunning: false, endTime: new Date().getTime() }),
    log: (payload) => set((state) => ({ logs: [...state.logs, payload] })),
    setNodeState: (nodeStates) => set({ nodeStates }),
    setNodeStateFromNodeId: (nodeId, nodeState) => set((state) => ({ nodeStates: { ...state.nodeStates, [nodeId]: nodeState } })),
    increaseInToken: (amount) => set((state) => ({ inToken: state.inToken + amount })),
    increaseOutToken: (amount) => set((state) => ({ outToken: state.outToken + amount })),
    increaseAmount: (amount) => set((state) => ({ amount: new Decimal(state.amount).add(amount).toNumber() })),
    setInToken: (inToken) => set({ inToken }),
    setOutToken: (outToken) => set({ outToken }),
    setAmount: (amount) => set({ amount }),
}));

const processOnConnect = (
    nodes: AppNode[],
    edges: Edge[],
    targetNode: AppNode,
    sourceNode: AppNode,
    newEdge: Edge,
    updates: UpdatePayload,
) => {
    const targetNodeDetails = getNodeDetails(targetNode.type);
    const sourceNodeDetails = getNodeDetails(sourceNode.type);

    if (targetNodeDetails.OnConnect) {
        targetNodeDetails.OnConnect({ nodes, edges, targetNode, sourceNode, connectedEdge: newEdge }, updates)
    }

    if (sourceNodeDetails.OnConnect) {
        sourceNodeDetails.OnConnect({ nodes, edges, targetNode, sourceNode, connectedEdge: newEdge }, updates);
    }
}

const processOnDisconnect = (
    nodes: AppNode[],
    edges: Edge[],
    targetNode: AppNode,
    sourceNode: AppNode,
    updates: UpdatePayload,
) => {
    const targetNodeDetails = getNodeDetails(targetNode.type);
    const sourceNodeDetails = getNodeDetails(sourceNode.type);

    if (targetNodeDetails.OnDisconnect) {
        targetNodeDetails.OnDisconnect({ nodes, edges, targetNode, sourceNode }, updates)
    }

    if (sourceNodeDetails.OnDisconnect) {
        sourceNodeDetails.OnDisconnect({ nodes, edges, targetNode, sourceNode }, updates);
    }
}

const processNodeThread = (
    node: { node: AppNode, parentNode?: AppNode, thread: string },
    nodes: AppNode[],
    edges: Edge[],
    updates: UpdatePayload
) => {
    const nodesToProcess = [node]
    while (nodesToProcess.length > 0) {
        const { node: currentNode, parentNode, thread } = nodesToProcess.pop()!;
        if (updates.nodes[currentNode.id] || (currentNode.data.thread == thread && currentNode.data.parentId == parentNode?.id)) continue;
        
        let newThread = parentNode && parentNode.type === 'multi_thread' ? Math.random().toString(16).slice(2) : thread
        if (currentNode.type === 'thread_merge') {
            const otherParents = getIncomers(currentNode, nodes, edges);
            if (parentNode || otherParents.length > 0) {
                const nodesWithUpdates = nodes.filter(node => updates.nodes[node.id] !== null).map(node => node.id in updates.nodes ? { ...merge(node, updates.nodes[node.id]) } : node)
                if (parentNode) {
                    otherParents.push(parentNode)
                }
                newThread = findParentMultiThreadNodeThread(otherParents, nodesWithUpdates, edges);
            }
        }

        updates['nodes'][currentNode.id] = merge(updates['nodes'][currentNode.id], { data:{ thread: newThread, parentId: parentNode?.id } });
        const children = getOutgoers(currentNode, nodes, edges);
        nodesToProcess.push(...children.map(child => ({ node: child, parentNode: currentNode, thread: newThread })));
    }

    const nodesWithUpdates = nodes.filter(node => updates.nodes[node.id] !== null).map(node => node.id in updates.nodes ? { ...merge(node, updates.nodes[node.id]) } : node)
    const edgeProcess = [nodesWithUpdates.find(x => x.id == node.node.id)!]
    const checked: {[key: string]: boolean} = {}
    while (edgeProcess.length > 0) {
        const currentNode = edgeProcess.pop()!;
        if (checked[currentNode.id]) continue;

        const parents = getIncomers(currentNode, nodesWithUpdates, edges);
        const notMatchingThreads = currentNode.type == 'thread_merge' ? [] : parents.filter(x => x.data.thread != currentNode.data.thread && x.type != 'multi_thread')
        const needToRemoveEdges = notMatchingThreads.map(x => edges.find(y => y.source == x.id && y.target == currentNode.id)!)

        needToRemoveEdges.forEach(x => {
            updates.edges[x.id] = null
        })

        checked[currentNode.id] = true
        const children = getOutgoers(currentNode, nodesWithUpdates, edges);
        edgeProcess.push(...children);
    }
};

export const findParentMultiThreadNodeThread = (
    nodesToProcess: AppNode[],
    nodes: AppNode[],
    edges: Edge[],
) => {
    while (nodesToProcess.length > 0) {
        const currentNode = nodesToProcess.pop()!;
        if (currentNode.type == 'multi_thread') return currentNode.data.thread
        const children = getIncomers(currentNode, nodes, edges);
        nodesToProcess.push(...children);
    }
    return Math.random().toString(16).slice(2)
}

const initialNodes: AppNode[] = [{
    id: 'start',
    type: 'start',
    position: { x: 0, y: 0 },
    data: { thread: 'main', state: 'idle' }
}];

const initialEdges: Edge[] = [];

const computed = createComputed((state: AppState) => ({
    isOnlyOneSelected: state.nodes.filter(node => node.selected).length === 1,
    selectedNode: state.nodes.find(node => node.selected)
}));

export const useTemporalFlowStore = <T,>(
    selector: (state: TemporalState<Partial<AppState>>) => T,
) => useStore(useFlowStore.temporal, selector);

export const useFlowStore = create<AppState>()(temporal(persist(computed((set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    onNodesChange: changes => {
        const filteredChanges = changes.filter(change => !(change.type === 'remove' && change.id === 'startNode'));
        set({ nodes: applyNodeChanges(filteredChanges, get().nodes) });
    },
    onEdgesChange: changes => {
        const { edges, nodes } = get();
        const newEdges = applyEdgeChanges(changes, edges)
        const removedEdgesId = changes.filter(change => change.type === 'remove').map(change => change.id);
        const removedEdges = edges.filter(edge => removedEdgesId.includes(edge.id));

        const updates: UpdatePayload = {
            edges: {},
            nodes: {}
        };

        for (const edge of removedEdges) {
            const targetNode = nodes.find(node => node.id === edge.target)!;
            const sourceNode = nodes.find(node => node.id === edge.source)!;

            if (targetNode.data.parentId !== sourceNode.id && targetNode.data.thread === sourceNode.data.thread) continue;

            processOnDisconnect(nodes, edges, targetNode, sourceNode, updates)
            const otherParents = getIncomers(targetNode, nodes, newEdges);
            const sourceThread = otherParents.length == 0 ? Math.random().toString(16).slice(2) : otherParents[0].data.thread;
            processNodeThread({ node: targetNode, thread:sourceThread }, nodes, newEdges, updates);
        }

        set({
            edges: newEdges.filter(edge => updates.edges[edge.id] !== null).map(edge => edge.id in updates.edges ? { ...merge(edge, updates.edges[edge.id]) } : edge),
            nodes: nodes.filter(node => updates.nodes[node.id] !== null).map(node => node.id in updates.nodes ? { ...merge(node, updates.nodes[node.id]) } : node),
        });
    },
    onConnect: connection => {
        const { edges, nodes } = get();
        const newEdges = addEdge(connection, edges).map(x => (Object.fromEntries(Object.entries(x).filter(([key]) => !['markerEnd', 'style'].includes(key))) as Edge))
        const sourceNode = nodes.find(node => node.id === connection.source)!;
        const sourceThread = ((!sourceNode || sourceNode.type === 'multi_thread') ? Math.random().toString(16).slice(2) : sourceNode.data.thread) as string;
        const targetNode = nodes.find(node => node.id === connection.target)!;

        const updates: UpdatePayload = {
            edges: {},
            nodes: {}
        };

        if (targetNode.data.parentId !== sourceNode.id && targetNode.data.thread === sourceNode.data.thread) {
            set({ 
                edges: newEdges
            });
            return;
        };

        const newEdge = newEdges.find(x => x.source == sourceNode.id && x.target == targetNode.id)!
        processOnConnect(nodes, newEdges, targetNode, sourceNode, newEdge, updates)
        processNodeThread({ node: targetNode, parentNode: sourceNode, thread:sourceThread }, nodes, edges, updates);

        set({
            edges: newEdges.filter(edge => updates.edges[edge.id] !== null).map(edge => edge.id in updates.edges ? { ...merge(edge, updates.edges[edge.id]) } : edge),
            nodes: nodes.filter(node => updates.nodes[node.id] !== null).map(node => node.id in updates.nodes ? { ...merge(node, updates.nodes[node.id]) } : node),
        });
    },
    pushNode: node => set((s) => ({ nodes: [...s.nodes, node] })),
    setNodes: nodes => set({ nodes }),
    setEdges: edges => set({ edges }),
    updateNode: updatedNode => set({
        nodes: get().nodes.map(node => node.id === updatedNode.id ? updatedNode : node)
    }),
    updateEdge: updatedEdge => set({
        edges: get().edges.map(edge => edge.id === updatedEdge.id ? updatedEdge : edge)
    }),
    clearSelection: () => set((s) => ({ nodes:s.nodes.map(x => ({...x, selected: false})), edges:s.edges.map(x => ({...x, selected: false})) }))
})), {
    name: 'flow-store',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => Object.fromEntries(Object.entries(state).filter(([key]) => !['isOnlyOneSelected', 'selectedNode'].includes(key)))
}), {
    limit: 20,
    equality: deepEqual,
    handleSet: (handleSet) => debounce(handleSet, 1000, {
        leading: true,
        trailing: false,
    }),
    partialize: ({ nodes, edges }) => ({ nodes, edges }) as AppState
}));
