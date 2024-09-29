import { getIncomers } from '@xyflow/react';
import { Merge } from 'lucide-react';
import { AppContext, NodeMetaData, NodeState, StatsUpdater } from '@/lib/nodes';
import { useFlowStore, AppNode, AppNodeProp } from '@/lib/store';
import { cloneDeep, set } from 'lodash';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useMemo } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import NoteIcon from '../node_icon';
import { ThreadSourceHandle, ThreadTargetHandle } from '../thread_handle';
import DevMode from '../dev_mode';

export const Metadata: NodeMetaData = {
    type: 'thread_merge',
    name: 'Thread Merge',
    description: 'This node will wait until all connected parallel threads ends',
    tags: ['await', 'sync']
}

export const Process = async (context: AppContext, node: AppNode, nextNodes: AppNode[], statsUpdater: StatsUpdater) => {
    await new Promise((resolve) => {
        const WaitTillAllEnd = () => {
            const { nodes, edges } = useFlowStore.getState()
            const incomers = getIncomers(node, nodes, edges)
            const havePending = incomers.some(x => ['idle', 'waiting', 'running'].includes(x.data.state as string))
            if (havePending) {
                setTimeout(WaitTillAllEnd, 200)
            } else {
                resolve(true);
            }
        }
        WaitTillAllEnd()
    })
    statsUpdater.log("merge_thread node", 'context', context, 'node', node);
    context[node.id]['name'] = node.data.name || 'hi'
    return nextNodes
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
                    placeholder={Metadata.name}
                    onChange={(e) => setValue('name', e.target.value)}
                />
            </div>
        </div>
    )
}

const noteStateVariants = cva(
    "bg-white border-2 text-blue-600 border-blue-600 bg-opacity-80 p-2 flex flex-col gap-2 items-center", //tw
    {
        variants: {
            state: {
                idle: 'bg-opacity-80',
                faded: 'opacity-20', //tw
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
        <div className={cn(noteStateVariants({ state }))}>
            <ThreadTargetHandle active={isConnectable} type='multi' />
            <div className='flex gap-2'>
                <NoteIcon state={state} idleIcon={Merge} className='rotate-180' />
                <span className='text-sm font-semibold'>{name}</span>
            </div>
            <DevMode data={data} />
            <ThreadSourceHandle active={isConnectable} />
        </div>
    );
}
