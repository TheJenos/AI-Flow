import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, getOutgoers } from '@xyflow/react';
import { createComputed } from "zustand-computed"
import { persist, createJSONStorage } from 'zustand/middleware'

import {
    Edge,
    Node,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
} from '@xyflow/react';

export type AppNode = Node;

export type AppState = {
    isRunning: boolean;
    nodes: AppNode[];
    edges: Edge[];
    onNodesChange: OnNodesChange<AppNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: (nodes: AppNode[]) => void;
    setEdges: (edges: Edge[]) => void;
    updateNode: (updatedNode: AppNode) => void;
    start: () => void;
    stop: () => void;
};

const initialNodes: Node[] = [
    {
        id: 'start',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
            thread: 'main'
        }
    },
];

const initialEdges: Edge[] = [];

const computed = createComputed((state: AppState) => ({
    isOnlyOneSelected: state.nodes.filter((node) => node.selected).length == 1,
    selectedNode: state.nodes.find((node) => node.selected)
}))

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useFlowStore = create<AppState>()(persist(computed((set, get) => ({
    isRunning: false,
    nodes: initialNodes,
    edges: initialEdges,
    onNodesChange: (changes) => {
        // Not allowing the start node to be removed
        const filteredChanges = changes.filter((change) => !(change.type == 'remove' && change.id == 'startNode'));
        set({
            nodes: applyNodeChanges(filteredChanges, get().nodes),
        });
    },
    onEdgesChange: (changes) => {
        const edges = get().edges
        const nodes = get().nodes

        const removedEdgesId = changes.filter(change => change.type == 'remove').map((y) => y.id);
        const removedEdges = edges.filter(x => removedEdgesId.includes(x.id)); 

        const updates:{[key:string]: {
            newThread: string
            parentId?: string
        }} = {}

        for (const edge of removedEdges) {
            const newThread = Math.random().toString(16).slice(2);
            const targetNode = nodes.find(node => node.id === edge.target);
            const sourceNode = nodes.find(node => node.id === edge.source);

            if (!targetNode || !sourceNode) continue;
            if (targetNode.type == 'thread_merge') continue
            if (targetNode.data.parentId != sourceNode.id && targetNode.data.thread === sourceNode.data.thread) continue;

            const nodesToProcess: {
                node:AppNode
                parentNode?: AppNode
            }[] = [{
                node: targetNode
            }];
            
            while (nodesToProcess.length > 0) {
                const {node:currentNode, parentNode} = nodesToProcess.pop()!;
                if (currentNode.type == 'thread_merge') continue;
                if (!(currentNode.id in updates)) {
                    updates[currentNode.id] = {
                        newThread,
                        parentId: parentNode?.id
                    }
                    if (currentNode.type == 'multi_thread') continue;
                    const children = getOutgoers(currentNode, nodes, edges);
                    nodesToProcess.push(...children.map(x => ({
                        node:x,
                        parentNode: currentNode
                    })));
                }
            }
        }

        set({
            nodes: get().nodes.map(node => {
                if (node.id in updates) {
                    return { ...node, data: { ...node.data, thread: updates[node.id].newThread, parentId: updates[node.id].parentId } }
                }
                return node;
            }),
            edges: applyEdgeChanges(changes, edges),
        });
    },
    onConnect: (connection) => {
        const edges = get().edges
        const nodes = get().nodes

        const parentNode =  nodes.find(node => node.id === connection.source)
        const parentTread = (!parentNode || parentNode.type == 'multi_thread') ? Math.random().toString(16).slice(2) : parentNode.data.thread as string;
        const currentNode = nodes.find(node => node.id === connection.target);

        if (!parentNode || !currentNode) return;
        if (currentNode.type == 'thread_merge' || (currentNode.data.parentId != parentNode.id && parentNode.data.thread === currentNode.data.thread)) {
            set({
                edges: addEdge(connection, get().edges),
            });
            return
        }

        const updates:{[key:string]: {
            newThread: string
            parentId?: string
        }} = {}

        const nodesToProcess: {
            node:AppNode
            parentNode?: AppNode
        }[] = [{
            node: currentNode,
            parentNode: parentNode
        }];
        
        while (nodesToProcess.length > 0) {
            const {node:currentNode, parentNode} = nodesToProcess.pop()!;
            if (currentNode.type == 'thread_merge') continue;
            if (!(currentNode.id in updates)) {
                updates[currentNode.id] = {
                    newThread: parentTread,
                    parentId: parentNode?.id
                }
                if (currentNode.type == 'multi_thread') continue;
                const children = getOutgoers(currentNode, nodes, edges);
                nodesToProcess.push(...children.map(x => ({
                    node:x,
                    parentNode: currentNode
                })));
            }
        }
        
        set({
            edges: addEdge(connection, get().edges),
            nodes: get().nodes.map(node => {
                if (node.id in updates) {
                    return { ...node, data: { ...node.data, thread: updates[node.id].newThread, parentId: updates[node.id].parentId } }
                }
                return node;
            })
        });
    },
    setNodes: (nodes) => {
        set({ nodes });
    },
    setEdges: (edges) => {
        set({ edges });
    },
    updateNode: (updatedNode: AppNode) => {
        set({
            nodes: get().nodes.map(node =>
                node.id === updatedNode.id ? { ...node, ...updatedNode } : node
            ),
        });
    },
    start: () => {
        set({ isRunning: true });
    },
    stop: () => {
        set({ isRunning: false });
    }
})),
    {
        name: 'flow-store',
        storage: createJSONStorage(() => localStorage)
    }
));

export default useFlowStore;
