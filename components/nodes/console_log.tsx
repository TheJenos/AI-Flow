import { Captions } from 'lucide-react';
import { AppContext, Controller, NodeLogViewProps, NodeMetaData, NodeOutput } from '@/lib/nodes';
import { useFlowStore, AppNode, AppNodeProp, NodeData, useRuntimeStore } from '@/lib/store';
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
import { runStatement, validateStatement } from '@/lib/logics';
import MarkdownViewer from '../ui/markdown_viewer';

type ConsoleLogData = NodeData & {
    log: string
}

export const Metadata: NodeMetaData = {
    type: 'console_log',
    name: 'Console Log',
    description: 'Logs messages to the console for debugging purposes',
    tags: ['debug', 'log', 'console']
}

export const Outputs = (node: AppNode<ConsoleLogData>) => {
    return {
        name: {
            title: 'Node name',
            description: 'Name used in the node',
            value: node.data.name
        },
        log: {
            title: 'Log statement',
            description: 'statement used in the node',
            value: node.data.log
        },
    } as NodeOutput
}

export function LogView({ payload }: NodeLogViewProps<string>) {
    return <>
        <MarkdownViewer text={payload} />
    </>;
}

export const Process = async (context: AppContext, node: AppNode<ConsoleLogData>, nextNodes: AppNode[], controller: Controller) => {
    const output = runStatement(node.data.log, context)
    if (output) {
        console.log(`Log:${node.id} `, output);
        controller.log({
            id: node.id,
            type: 'success',
            title: "Log has send to the browser console as well",
            nodeType: node.type,
            payload: output
        });
    }
    return nextNodes
}

export const Properties = ({ node }: { node: AppNode<ConsoleLogData> }) => {
    const updateNode = useFlowStore(state => state.updateNode);

    const setValue = (key: string, value: string) => {
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.${key}`, value);
        updateNode(clonedNode);
    }

    const isValidCondition = useMemo(() => validateStatement(node.data.log),[node.data.log])

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
                <Label className='text-sm font-semibold' htmlFor="log">Log <span className={isValidCondition ? 'text-green-600': 'text-red-600'}>{isValidCondition ? '(Valid)' : '(Invalid)'}</span></Label>
                <Textarea
                    id="log"
                    name="log"
                    value={node.data.log}
                    className='h-20'
                    classNameFrame={isValidCondition ? 'outline !outline-green-600' : 'outline !outline-red-600'}
                    placeholder='Enter your statement here...'
                    onChange={(e) => setValue('log', e.target.value)}
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
                <NoteIcon state={state} idleIcon={Captions} />
                <span className='text-sm font-semibold'>{name}</span>
            </div>
            <DevMode data={data} />
            <ThreadSourceHandle active={isConnectable} />
        </div>
    );
}
