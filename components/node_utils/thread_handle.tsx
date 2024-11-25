import { useFlowStore,  AppNode, findParentMultiThreadNodeThread } from "@/lib/stores/flow_store";
import { Handle, Position, Edge, Connection, getIncomers, getOutgoers, useHandleConnections } from "@xyflow/react";

type ThreadHandleProp = {
    active?: boolean
    type?: 'normal' | 'multi'
}

export function ThreadTargetHandle({ active = true, type = 'normal' }: ThreadHandleProp) {
    const nodes = useFlowStore((state) => state.nodes)
    const edges = useFlowStore((state) => state.edges)
    const connections = useHandleConnections({
        type: 'target',
    });

    const isValidConnection = (connection: Edge | Connection) => {
        if (connection.source == connection.target) return false

        const otherNode = nodes.find(x => x.id == connection.source) as AppNode

        if (otherNode.type == "multi_thread" || otherNode.type == "decision") return true

        const outgoers = getOutgoers(otherNode, nodes, edges)
        if (connections.length == 0 && outgoers.length == 0) return true

        const selfNode = nodes.find(x => x.id == connection.target) as AppNode

        if (selfNode.type == "thread_merge")  {
            const otherThread = findParentMultiThreadNodeThread([otherNode], nodes, edges)
            if (selfNode.data.thread == otherThread) return true
        }

        return selfNode?.data.thread == otherNode?.data.thread;
    }

    return active ? (<Handle
        type="target"
        position={Position.Top}
        className='!rounded-md !w-1/5 !h-2 max-w-auto max-h-auto bg-primary'
        isValidConnection={isValidConnection}
        isConnectableStart={type=="multi" || connections.length == 0}
    />) : null
}

export function ThreadSourceHandle({ active = true, type = 'normal' }: ThreadHandleProp) {
    const nodes = useFlowStore((state) => state.nodes)
    const edges = useFlowStore((state) => state.edges)
    const connections = useHandleConnections({
        type: 'source',
    });

    const isValidConnection = (connection: Edge | Connection) => {
        if (connection.source == connection.target) return false

        const otherNode = nodes.find(x => x.id == connection.target) as AppNode
        
        const incomers = getIncomers(otherNode, nodes, edges)
        if (connections.length == 0 && incomers.length == 0) return true

        const selfNode = nodes.find(x => x.id == connection.source) as AppNode
        
        if (otherNode.type == "thread_merge" && incomers.length > 0)  {
            const selfThread = findParentMultiThreadNodeThread([selfNode], nodes, edges)
            if (otherNode.data.thread == selfThread) return true
        }

        if (selfNode.type == "multi_thread" || selfNode.type == "decision") return true

        return selfNode?.data.thread == otherNode?.data.thread;
    }

    return active ? (<Handle
        type="source"
        position={Position.Bottom}
        className='!rounded-md !w-1/5 !h-2 max-w-auto max-h-auto bg-primary'
        isValidConnection={isValidConnection}
        isConnectableStart={type=="multi" || connections.length == 0}
    />) : null
}