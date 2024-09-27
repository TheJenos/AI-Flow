import { CircleHelp } from 'lucide-react';
import { Card } from '../ui/card';
import { AppContext, getNodeDetails, NodeMetaData, NodeState } from '@/lib/nodes';
import { useFlowStore, AppNode, AppNodeProp } from '@/lib/store';
import { cloneDeep, get, set } from 'lodash';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useMemo } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import NoteIcon from '../node_icon';
import { ThreadSourceHandle, ThreadTargetHandle } from '../thread_handle';
import DevMode from '../dev_mode';
import { useShallow } from 'zustand/shallow';
import { getOutgoers } from '@xyflow/react';

export const Metadata: NodeMetaData = {
    type: 'decision',
    name: 'Decision',
    description: 'A node that signifies a decision point in the flow. Only one condition will be effective even if multiple conditions are true.'
}

export const Process = async (context: AppContext, node: AppNode, nextNodes: AppNode[]) => {
    console.log("decision node", 'context', context, 'node', node);
    context['run'] = (context['run'] as number) + 1;
    // throw new Error("test");
    return nextNodes
}

export const Properties = ({ node }: { node: AppNode }) => {
    const { updateNode, nodes, edges } = useFlowStore(useShallow(state => ({
        updateNode: state.updateNode,
        nodes: state.nodes,
        edges: state.edges
    })));

    const setValue = (key: string, value: string) => {
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.${key}`, value);
        updateNode(clonedNode);
    }

    const setNodeValue = (nodeId: string,key: string, value: string) => {
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.decisions.${nodeId}.${key}`, value);
        updateNode(clonedNode);
    }

    const outgoners = useMemo(() => getOutgoers(node,nodes,edges).map(x => ({
        oNode:x,
        oNodeDetails: getNodeDetails(x.type)
    })), [node, nodes, edges])

    return (
        <div className='flex flex-col gap-2 px-2'>
            <div className='flex flex-col gap-1'>
                <Label>Name</Label>
                <Input
                    name="name"
                    value={node.data.name as string}
                    placeholder={Metadata.name}
                    onChange={(e) => setValue('name', e.target.value)}
                />
            </div>
            {outgoners.map(({oNode, oNodeDetails}, index) => (
                <div key={index} className="flex flex-col pb-2 border-b border-gray-200">
                    <div className="flex flex-col mb-1 gap-2">
                        <Label className='text-sm font-semibold'>Decision point name for {oNode.data.name ? `${oNode.data.name} (${oNodeDetails.name})` : oNodeDetails.name}</Label>
                        <Input
                            name="name"
                            value={get(node, `data.decisions.${oNode.id}.name`, '')}
                            onChange={(e) => setNodeValue(oNode.id,'name', e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col mb-1 gap-2">
                        <Label className='text-sm font-semibold'>logic</Label>
                        <Input
                            name="logic"
                            value={get(node, `data.decisions.${oNode.id}.logic`, '')}
                            onChange={(e) => setNodeValue(oNode.id,'logic', e.target.value)}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

const noteStateVariants = cva(
    "bg-blue-600 bg-opacity-80 p-2 flex flex-col gap-2 items-center text-white",
    {
        variants: {
            state: {
                idle: 'bg-opacity-80',
                waiting: 'bg-opacity-20',
                running: 'bg-opacity-40',
                completed: 'bg-opacity-80',
                failed: 'bg-opacity-80',
            }
        },
        defaultVariants: {
            state: 'idle'
        }
    }
)

export function Node({ isConnectable, data }: AppNodeProp) {
    const name = useMemo(() => {
        return (data?.name || Metadata.name) as string;
    }, [data?.name]);

    const state = (data.state || 'idle') as NodeState;

    return (
        <Card className={cn(noteStateVariants({ state }))}>
            <ThreadTargetHandle active={isConnectable} />
            <div className='flex gap-2'>
                <NoteIcon state={state} idleIcon={CircleHelp} />
                <span className='text-sm font-semibold'>{name}</span>
            </div>
            <DevMode data={data} />
            <ThreadSourceHandle active={isConnectable} type='multi' />
        </Card>
    );
}
