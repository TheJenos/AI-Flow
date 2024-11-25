import React, { useMemo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import { getSmartEdge } from '@/lib/smartEdge';
import { useFlowStore } from '@/lib/stores/flow_store';
import { pathfindingJumpPointNoDiagonal, svgDrawSmoothLinePath, NodeWithDetails } from '@/lib/smartEdge/functions';

export default function CustomEdge(props: EdgeProps) {
  const nodes = useFlowStore(state => state.nodes) as  NodeWithDetails[]
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, ...rest } = props;

  const [edgePath, labelX, labelY] = useMemo(() => {

    if (sourceY > targetY ) {
      const values = getSmartEdge({
        sourcePosition,
        targetPosition,
        sourceX,
        sourceY,
        targetX,
        targetY,
        nodes,
        options: {
          drawEdge: svgDrawSmoothLinePath,
	        generatePath: pathfindingJumpPointNoDiagonal,
        }
      })

      if (!values) return getBezierPath({
        sourcePosition,
        targetPosition,
        sourceX,
        sourceY,
        targetX,
        targetY,
      })

      return [values.svgPathString, values.edgeCenterX, values.edgeCenterY]
    }

    return getBezierPath({
      sourcePosition,
      targetPosition,
      sourceX,
      sourceY,
      targetX,
      targetY,
    })

  }, [nodes, sourcePosition, sourceX, sourceY, targetPosition, targetX, targetY]);

	return (
		<BaseEdge
			path={edgePath}
			labelX={labelX}
			labelY={labelY}
			{...rest}
		/>
	)
}