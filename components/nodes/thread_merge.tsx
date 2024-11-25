import { getIncomers } from '@xyflow/react';
import { Merge } from 'lucide-react';
import { AppContext, NodeMetaData } from '@/lib/nodes';
import { useFlowStore, AppNode, AppNodeProp } from '@/lib/stores/flow_store';
import { useRuntimeStore } from '@/lib/stores/runtime_store';
import { cloneDeep, set } from 'lodash';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useMemo } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import NoteIcon from '../node_utils/node_icon';
import { ThreadSourceHandle, ThreadTargetHandle } from '../node_utils/thread_handle';
import DevMode from '../node_utils/dev_mode';

export const Metadata: NodeMetaData = {
    type: 'thread_merge',
    name: 'Thread Merge',
    description: 'This node will wait until all connected parallel threads ends',
    tags: ['await', 'sync']
}

export const Process = async (context: AppContext, node: AppNode, nextNodes: AppNode[]) => {
    await new Promise((resolve) => {
        const WaitTillAllEnd = () => {
            const { nodes, edges } = useFlowStore.getState()
            const { nodeStates } = useRuntimeStore.getState()
            const incomers = getIncomers(node, nodes, edges)
            const havePending = incomers.map(x => nodeStates[x.id]).some(x => ['idle', 'waiting', 'running'].includes(x))
            if (havePending) {
                setTimeout(WaitTillAllEnd, 200)
            } else {
                resolve(true);
            }
        }
        WaitTillAllEnd()
    })
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
        <div className='flex flex-col gap-2 px-3'>
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
                idle: '',
                faded: 'opacity-20', //tw
                waiting: 'opacity-20',
                running: 'opacity-40',
                completed: 'opacity-100',
                failed: 'opacity-20 outline outline-red-500', //tw
            }
        },
        defaultVariants: {
            state: 'idle'
        }
    }
)

export function Node({ id, selectable, isConnectable, data }: AppNodeProp) {
    const state = useRuntimeStore((state) => selectable != undefined && !selectable ? "faded" : state.nodeStates[id])
    const name = useMemo(() => {
        return (data?.name || Metadata.name) as string;
    }, [data?.name]);

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
