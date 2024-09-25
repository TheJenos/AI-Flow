import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { createComputed } from "zustand-computed"

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
    updateNode: (updatedNode:AppNode) => void;
    start: () => void;
    stop: () => void;
};

const initialNodes: Node[] = [
    { 
        id: 'start',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
            properties: [
                { name: 'name', type: 'string' },
            ],
            propertyValues: {
                name: 'John Doe'
            }
        }
    },
    {
        id: 'prompt',
        type: 'prompt',
        position: { x: 0, y: 100 },
        data: {
            name: 'Test Prompt',
            model: 'gpt-4o',
            prompt: 'Hello, how are you?'
        }
    }
];

const initialEdges: Edge[] = [
    { id: 'e1-2', source: 'start', target: 'prompt' }
];

const computed = createComputed((state: AppState) => ({
    isOnlyOneSelected: state.nodes.filter((node) => node.selected).length == 1,
    selectedNode: state.nodes.find((node) => node.selected)
}))

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useFlowStore = create<AppState>()(computed((set, get) => ({
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
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },
    setNodes: (nodes) => {
        set({ nodes });
    },
    setEdges: (edges) => {
        set({ edges });
    },
    updateNode: (updatedNode:AppNode) => {
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
})));

export default useFlowStore;
