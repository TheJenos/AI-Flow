import { NodeProps } from '@xyflow/react';
import { Split } from 'lucide-react';
import { Card } from '../ui/card';
import { NodeMetaData, NodeState } from '@/lib/nodes';
import useFlowStore, { AppNode } from '@/lib/store';
import { cloneDeep, set } from 'lodash';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useMemo } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import NoteIcon from '../node_icon';
import { ThreadSourceHandle, ThreadTargetHandle } from '../thread_handle';

export const Metadata: NodeMetaData = {
    type: 'multi_thread',
    name: 'Multi Tread',
    description: 'This node allows you to run multiple threads in parallel'
}

export const Process = async (context: {[key: string]: string | number | object}, node: AppNode) => {
    console.log("multi_thread node",'context', context, 'node', node);
    context['run'] = (context['run'] as number) + 1;
    return context
}

export const Properties = ({ node }: { node: AppNode }) => {
    const updateNode = useFlowStore(state => state.updateNode);

    const setValue = (key: string, value: string) => {
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.${key}`, value);
        updateNode(clonedNode);
    }

    return (
        <div className='flex flex-col gap-2 px-2'>
            <div className='flex flex-col gap-1'> 
                <Label>Name</Label>
                <Input
                    name="name"
                    value={node.data.name as string}
                    onChange={(e) => setValue('name', e.target.value)}
                />
            </div>
        </div>
    )
}

const noteStateVariants = cva(
    "bg-blue-600 bg-opacity-80 p-2 flex gap-2 items-center text-white",
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

export function Node({ isConnectable, data }: NodeProps) {
    const name = useMemo(() => {
        return (data?.name || 'Multi Tread') as string;
    }, [data?.name]);

    const state = (data.state || 'idle') as NodeState;
    const thread = (data.thread || 'not found') as string;

    return (
        <Card className={cn(noteStateVariants({ state }))}>
            <ThreadTargetHandle active={isConnectable} />
            <NoteIcon state={state} idleIcon={Split} className='rotate-180' />  <span className='text-sm font-semibold'>{name} {thread}</span>
            <ThreadSourceHandle active={isConnectable} type='multi' />
        </Card>
    );
}
