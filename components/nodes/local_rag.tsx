import { Cog } from 'lucide-react';
import { AppContext, Controller, NodeLogViewProps, NodeMetaData, NodeOutput, OutputExtra } from '@/lib/nodes';
import { useFlowStore, AppNode, AppNodeProp, NodeData } from '@/lib/stores/flow_store';
import { useRuntimeStore } from '@/lib/stores/runtime_store';
import { cloneDeep, set } from 'lodash';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { useMemo } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import NoteIcon from '../node_utils/node_icon';
import { ThreadSourceHandle, ThreadTargetHandle } from '../node_utils/thread_handle';
import DevMode from '../node_utils/dev_mode';
import MarkdownViewer from '../ui/markdown_viewer';

type RagData = NodeData & {
    input: string
    source: string
}

export const Metadata: NodeMetaData = {
    type: 'local_rag',
    name: 'Local RAG',
    description: 'This node implements the Retrieval Augmented Generation (RAG) model for enhancing responses with retrieved information.',
    tags: ['rag', 'Retrieval', 'Augmented', 'Generation']
}

export const Outputs = (node: AppNode<RagData>, extra: OutputExtra) => {
    return {
        name: {
            title: 'Node name',
            description: 'Name used in the node',
            value: node.data.name
        },
        context: {
            title: 'Context Response',
            description: 'The retrieved context used to augment the generation process.',
            value: extra.context
        }
    } as NodeOutput
}

export function LogView({ payload }: NodeLogViewProps<string>) {
    return <>
        <MarkdownViewer text={payload} />
    </>;
}

export const Process = async (context: AppContext, node: AppNode<RagData>, nextNodes: AppNode[], controller: Controller) => {
    console.log(controller);
   
    return nextNodes
}

export const Properties = ({ node }: { node: AppNode<RagData> }) => {
    const updateNode = useFlowStore(state => state.updateNode);

    const setValue = (key: string, value: string) => {
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.${key}`, value);
        updateNode(clonedNode);
    }

    return (
        <div className='flex flex-col gap-3 px-3'>
            <div className='flex flex-col gap-1'>
                <Label>Name</Label>
                <Input
                    name="name"
                    value={node.data.name}
                    placeholder={Metadata.name}
                    onChange={(e) => setValue('name', e.target.value)}
                />
            </div>
            <div className='flex flex-col gap-1'>
                <Label>Source</Label>
                <Input
                    name="source"
                    value={node.data.source}
                    placeholder="Source"
                    onChange={(e) => setValue('source', e.target.value)}
                />
            </div>
            <div className='flex flex-col gap-1'>
                <Label className='text-sm font-semibold' htmlFor="log">User Input</Label>
                <Textarea
                    id="input"
                    name="input"
                    value={node.data.input}
                    className='h-20'
                    placeholder='Enter your statement here...'
                    onChange={(e) => setValue('input', e.target.value)}
                    node={node}
                    withoutRichText
                />
            </div>
        </div>
    )
}

const noteStateVariants = cva(
    "bg-white border-2 text-red-600 border-red-600 p-2 flex flex-col gap-2 rounded-md items-center  transition-all duration-300", //tw
    {
        variants: {
            state: {
                idle: '',
                faded: 'opacity-20', //tw
                waiting: 'opacity-20',
                running: 'opacity-40',
                completed: 'opacity-100',
                failed: 'opacity-80 outline outline-offset-1 outline-red-500', //tw
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
            <ThreadTargetHandle active={isConnectable} />
            <div className='flex gap-2'>
                <NoteIcon state={state} idleIcon={Cog} />
                <span className='text-sm font-semibold'>{name}</span>
            </div>
            <DevMode data={data} />
            <ThreadSourceHandle active={isConnectable} />
        </div>
    );
}
