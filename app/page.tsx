"use client";

import { nodeTypes } from '@/lib/nodes';
import useFlowStore from '@/lib/store';
import { Background, BackgroundVariant, ConnectionLineType, ReactFlow } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useShallow } from 'zustand/shallow';

export default function Home() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useFlowStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
    }))
  );

  return (
    <div className='bg-white absolute inset-0 h-full w-full'>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        connectionLineType={ConnectionLineType.SmoothStep}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        maxZoom={1}
        >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
