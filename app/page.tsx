"use client";

import { nodeTypes } from '@/lib/nodes';
import { useFlowStore } from '@/lib/store';
import { Background, BackgroundVariant, MarkerType, ReactFlow } from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useShallow } from 'zustand/shallow';
import CustomEdge from '@/components/node_utils/custom_edge';
import Clipboard from '@/components/node_utils/clipboard';

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
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={{
          default: CustomEdge
        }}
        defaultEdgeOptions={{
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
          },
          style: {
            strokeWidth: 2,
          }
        }}
        snapToGrid
        snapGrid={[20,20]}
        fitView
        fitViewOptions={{
          padding: 0.3
        }}
        maxZoom={1.5}
        >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Clipboard/>
      </ReactFlow>
    </div>
  );
}
