"use client";

import StartNode from '@/components/nodes/start';
import useStore from '@/lib/store';
import { Background, BackgroundVariant, ReactFlow } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useShallow } from 'zustand/shallow';

const nodeTypes = {
  start: StartNode,
};

export default function Home() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
    }))
  );

  return (
    <div className='bg-white' style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
