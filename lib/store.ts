import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, getOutgoers, NodeProps } from '@xyflow/react';
import { createComputed } from "zustand-computed";
import { persist, createJSONStorage } from 'zustand/middleware';
import { Edge, Node, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { NodeState, NodeType } from './nodes';
import { set } from 'lodash';

export type NodeData = {
    state: NodeState
    thread: string
    name?: string
    parentId?: string
}

export type AppNodeProp = NodeProps & {
    data: NodeData
}

export type AppNode = Node & { 
    type: NodeType 
    data: NodeData
};

export type AppState = {
    nodes: AppNode[];
    edges: Edge[];
    onNodesChange: OnNodesChange<AppNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: (nodes: AppNode[]) => void;
    setEdges: (edges: Edge[]) => void;
    updateNode: (updatedNode: AppNode) => void;
};

export type RuntimeState = {
    isRunning: boolean;
    start: () => void;
    stop: () => void;
};

export type SettingsState = {
    openAIKey: string;
    isDevMode: boolean;
    setOpenAIKey: (key: string) => void;
    setDevMode: (mode: boolean) => void;
};

export const useSettingStore = create<SettingsState>()(persist(set => ({
    openAIKey: '',
    isDevMode: false,
    setOpenAIKey: key => set({ openAIKey: key }),
    setDevMode: mode => set({ isDevMode: mode }),
}), {
    name: 'flow-setting-store',
    storage: createJSONStorage(() => localStorage)
}));

export const useRuntimeStore = create<RuntimeState>()(set => ({
    isRunning: false,
    start: () => set({ isRunning: true }),
    stop: () => set({ isRunning: false })
}));

const processDecisionNode = (
    targetNode: AppNode,
    sourceNode: AppNode,
    updates: { [key: string]: unknown },
) => {
    if (targetNode.type == 'decision') {
       set(updates,`${targetNode.id}.decisions`, Object.fromEntries(Object.entries(targetNode.data.decisions as object).filter(([key]) => key != sourceNode.id)))
    }

    if (sourceNode.type == 'decision') {
        set(updates,`${sourceNode.id}.decisions`, Object.fromEntries(Object.entries(sourceNode.data.decisions as object).filter(([key]) => key != targetNode.id)))
    }
}
 
const processNodeThread = (
    nodesToProcess: { node: AppNode, parentNode?: AppNode }[],
    nodes: AppNode[],
    edges: Edge[],
    updates: { [key: string]: { thread: string, parentId?: string } },
    thread: string
) => {
    while (nodesToProcess.length > 0) {
        const { node: currentNode, parentNode } = nodesToProcess.pop()!;
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

        for (const edge of removedEdges) {
            const newThread = Math.random().toString(16).slice(2);
            const targetNode = nodes.find(node => node.id === edge.target);
            const sourceNode = nodes.find(node => node.id === edge.source);

            if (!targetNode || !sourceNode || targetNode.type === 'thread_merge' ||
                (targetNode.data.parentId !== sourceNode.id && targetNode.data.thread === sourceNode.data.thread)) continue;

            processDecisionNode(targetNode, sourceNode, updates)

            const nodesToProcess = [{ node: targetNode }];
            processNodeThread(nodesToProcess, nodes, edges, updates, newThread);
        }

        set({
            edges: applyEdgeChanges(changes, edges),
            nodes: nodes.map(node => node.id in updates ? { ...node, data: { ...node.data, ...updates[node.id] } } : node),
        });
    },
    onConnect: connection => {
        const { edges, nodes } = get();
        const sourceNode = nodes.find(node => node.id === connection.source);
        const sourceThread = ((!sourceNode || sourceNode.type === 'multi_thread') ? Math.random().toString(16).slice(2) : sourceNode.data.thread) as string;
        const targetNode = nodes.find(node => node.id === connection.target);

        if (!sourceNode || !targetNode) return;
        if (targetNode.type === 'thread_merge' || (targetNode.data.parentId !== sourceNode.id && sourceNode.data.thread === targetNode.data.thread)) {
            set({ edges: addEdge(connection, edges) });
            return;
        }

        const updates: { [key: string]: { thread: string, parentId?: string } } = {};
        const nodesToProcess = [{ node: targetNode, parentNode: sourceNode }];
        processNodeThread(nodesToProcess, nodes, edges, updates, sourceThread);

        set({
            edges: addEdge(connection, edges),
            nodes: nodes.map(node => node.id in updates ? { ...node, data: { ...node.data, ...updates[node.id] } } : node)
        });
    },
    setNodes: nodes => set({ nodes }),
    setEdges: edges => set({ edges }),
    updateNode: updatedNode => set({
        nodes: get().nodes.map(node => node.id === updatedNode.id ? { ...node, ...updatedNode } : node)
    })
})), {
    name: 'flow-store',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) =>Object.fromEntries(Object.entries(state).filter(([key]) => !['isOnlyOneSelected', 'selectedNode'].includes(key)))
}));
