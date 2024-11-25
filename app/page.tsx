"use client";

import { nodeMap } from '@/lib/nodes';
import { useFlowStore, useTemporalFlowStore } from '@/lib/stores/flow_store';
import { Background, BackgroundVariant, MarkerType, ReactFlow } from '@xyflow/react';

import { useShallow } from 'zustand/shallow';
import CustomEdge from '@/components/node_utils/custom_edge';
import FlowContextMenu from '@/components/node_utils/flow_context_menu';

export default function Home() {
  const clearHistory = useTemporalFlowStore((state) => state.clear);
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
      <FlowContextMenu>
        <ReactFlow
          tabIndex={0}
          className='outline-none !bg-gray-100'
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeMap}
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
          snapGrid={[10, 10]}
          fitView
          fitViewOptions={{
            padding: 0.3
          }}
          maxZoom={1.5}
          onInit={() => clearHistory()}
          deleteKeyCode={["Delete", "Backspace"]}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </FlowContextMenu>
    </div>
  );
}
