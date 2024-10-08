import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, getOutgoers, NodeProps } from '@xyflow/react';
import { createComputed } from "zustand-computed";
import { persist, createJSONStorage } from 'zustand/middleware';
import { Edge, Node, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { getNodeDetails, NodeState, NodeType } from './nodes';

export type NodeData = {
    state: NodeState
    thread: string
    name?: string
    parentId?: string
}

export type AppNodeProp = NodeProps & {
    data: NodeData
}

export type AppNode<T = NodeData> = Node & {
    type: NodeType
    data: T
};

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
};

export type RuntimeState = {
    isRunning: boolean;
    logs: string[];
    startTime?: number,
    endTime?: number,
    inToken: number;
    outToken: number;
    amount: number;
    start: () => void;
    stop: () => void;
    log: (...logData:unknown[]) => void;
    increaseInToken: (amount: number) => void;
    increaseOutToken: (amount: number) => void;
    increaseAmount:(amount: number) => void;
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
    setDevMode: value => set({ devMode: value  }),
}), {
    name: 'flow-setting-store',
    storage: createJSONStorage(() => localStorage)
}));

export const useRuntimeStore = create<RuntimeState>()(set => ({
    isRunning: false,
    logs: [],
    startTime: undefined,
    endTime: undefined,
    duration: 0,
    inToken: 0,
    outToken: 0,
    amount: 0,
    start: () => set({ isRunning: true, startTime: new Date().getTime(), endTime: undefined, inToken: 0, outToken: 0, amount: 0 }),
    stop: () => set({ isRunning: false, endTime: new Date().getTime()}),
    log: (...logData) => set((state) => ({ logs: [...state.logs, ...logData.map(x => JSON.stringify(x))] })),
    increaseInToken: (amount) => set((state) => ({ inToken: state.inToken + amount })),
    increaseOutToken: (amount) => set((state) => ({ outToken: state.outToken + amount })),
    increaseAmount: (amount) => set((state) => ({ amount: state.amount + amount })),
    setInToken: (inToken) => set({ inToken }),
    setOutToken: (outToken) => set({ outToken }),
    setAmount: (amount) => set({ amount }),

}));

const processOnDisconnect = (
    targetNode: AppNode,
    sourceNode: AppNode,
    updates: { [key: string]: unknown },
) => {
    const targetNodeDetails = getNodeDetails(targetNode.type);
    const sourceNodeDetails = getNodeDetails(sourceNode.type);

    if (targetNodeDetails.OnDisconnect) {
        targetNodeDetails.OnDisconnect(targetNode, sourceNode, updates)
    }

    if (sourceNodeDetails.OnDisconnect) {
        sourceNodeDetails.OnDisconnect(sourceNode, targetNode, updates);
    }
}

const processNodeThread = (
    nodesToProcess: { node: AppNode, parentNode?: AppNode }[],
    nodes: AppNode[],
    edges: Edge[],
    updates: { [key: string]: { thread: string, parentId?: string } },
    thread: string,
    edgeRemover?: ((sourceNode: AppNode, targetNode: AppNode) => void | undefined) 
) => {
    while (nodesToProcess.length > 0) {
        const { node: currentNode, parentNode } = nodesToProcess.pop()!;
        if (edgeRemover && !!currentNode.data.parentId &&  !!parentNode?.id && currentNode.data.parentId != parentNode?.id) {
            edgeRemover(parentNode, currentNode)
            return
        }
        if (currentNode.type === 'thread_merge') continue;
        if (!(currentNode.id in updates)) {
            updates[currentNode.id] = { thread, parentId: parentNode?.id };
            if (currentNode.type === 'multi_thread') continue;
            const children = getOutgoers(currentNode, nodes, edges);
            nodesToProcess.push(...children.map(child => ({ node: child, parentNode: currentNode })));
        }
    }
};

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

export const useFlowStore = create<AppState>()(persist(computed((set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    onNodesChange: changes => {
        const filteredChanges = changes.filter(change => !(change.type === 'remove' && change.id === 'startNode'));
        set({ nodes: applyNodeChanges(filteredChanges, get().nodes) });
    },
    onEdgesChange: changes => {
        const { edges, nodes } = get();
        const removedEdgesId = changes.filter(change => change.type === 'remove').map(change => change.id);
        const removedEdges = edges.filter(edge => removedEdgesId.includes(edge.id));

        const updates: { [key: string]: { thread: string, parentId?: string } } = {};
        const removeEdges: string[] = [];

        for (const edge of removedEdges) {
            const newThread = Math.random().toString(16).slice(2);
            const targetNode = nodes.find(node => node.id === edge.target);
            const sourceNode = nodes.find(node => node.id === edge.source);

            if (!targetNode || !sourceNode || targetNode.type === 'thread_merge' ||
                (targetNode.data.parentId !== sourceNode.id && targetNode.data.thread === sourceNode.data.thread)) continue;

            processOnDisconnect(targetNode, sourceNode, updates)

            const nodesToProcess = [{ node: targetNode }];
            
            processNodeThread(nodesToProcess, nodes, edges, updates, newThread, (sourceNode, targetNode) => {
                const needToRemoveEdge = edges.find(x => x.source == sourceNode.id &&  x.target == targetNode.id)
                if (needToRemoveEdge) removeEdges.push(needToRemoveEdge.id)
            });
        }

        set({
            edges: applyEdgeChanges(changes, edges.filter(x => !removeEdges.includes(x.id))),
            nodes: nodes.map(node => node.id in updates ? { ...node, data: { ...node.data, ...updates[node.id] } } : node),
        });
    },
    onConnect: connection => {
        const { edges, nodes } = get();
        let newEdges = addEdge(connection, edges).map(x => (Object.fromEntries(Object.entries(x).filter(([key]) => !['markerEnd', 'style'].includes(key))) as Edge))
        const sourceNode = nodes.find(node => node.id === connection.source);
        const sourceThread = ((!sourceNode || sourceNode.type === 'multi_thread') ? Math.random().toString(16).slice(2) : sourceNode.data.thread) as string;
        const targetNode = nodes.find(node => node.id === connection.target);

        if (!sourceNode || !targetNode) return;
        if (sourceNode.type == 'decision') {
            newEdges = newEdges.map(x => {
                if (x.source == sourceNode.id && x.target == targetNode.id) {
                    return {
                        ...x,
                        animated: true,
                        label: 'Name and Condition required',
                        labelShowBg: true,
                        labelBgPadding: [5,5],
                        labelBgBorderRadius: 8,
                        labelBgStyle: {
                            stroke: 'black'
                        }
                    }
                }
                return x
            })
        }

        if (targetNode.type === 'thread_merge' || (targetNode.data.parentId !== sourceNode.id && sourceNode.data.thread === targetNode.data.thread)) {
            set({ edges: newEdges });
            return;
        }

        const updates: { [key: string]: { thread: string, parentId?: string } } = {};
        const nodesToProcess = [{ node: targetNode, parentNode: sourceNode }];
        processNodeThread(nodesToProcess, nodes, edges, updates, sourceThread);

        set({
            edges: newEdges,
            nodes: nodes.map(node => node.id in updates ? { ...node, data: { ...node.data, ...updates[node.id] } } : node)
        });
    },
    pushNode: node => set((s) => ({ nodes: [...s.nodes, node] })),
    setNodes: nodes => set({ nodes }),
    setEdges: edges => set({ edges }),
    updateNode: updatedNode => set({
        nodes: get().nodes.map(node => node.id === updatedNode.id ? { ...node, ...updatedNode } : node)
    }),
    updateEdge: updatedEdge => set({
        edges: get().edges.map(edge => edge.id === updatedEdge.id ? { ...edge, ...updatedEdge } : edge)
    })
})), {
    name: 'flow-store',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => Object.fromEntries(Object.entries(state).filter(([key]) => !['isOnlyOneSelected', 'selectedNode'].includes(key)))
}));
