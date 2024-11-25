import { Cog } from 'lucide-react';
import { AppContext, Controller, NodeMetaData, NodeOutput } from '@/lib/nodes';
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
import { runStatement, validateStatement } from '@/lib/logics';

type SetStateData = NodeData & {
    variable: string
    value: string
}

export const Metadata: NodeMetaData = {
    type: 'set_state',
    name: 'Set State',
    description: 'Sets the state of the node based on input values',
    tags: ['state', 'set', 'node'],
    valueIdentifier: () => "state"
}

export const Outputs = (node: AppNode<SetStateData>) => {
    return {
        name: {
            title: 'Node name',
            description: 'Name used in the node',
            value: node.data.name
        },
        ...(node.data.variable && node.data.value ? {
            [node.data.variable]: {
                title: 'Final Value',
                description: 'final computed assigned value',
                value: node.data.value
            },
        } : {}),
    } as NodeOutput
}

export const Process = async (context: AppContext, node: AppNode<SetStateData>, nextNodes: AppNode[], controller: Controller) => {
    if (!node.data.variable || !node.data.value) return nextNodes
    const isValidStatement = validateStatement(node.data.value)
    if (!isValidStatement) throw Error("Value statement is invalid")

    const valueIdentifier = Metadata.valueIdentifier && Metadata.valueIdentifier(node) || ''
    const output = runStatement(node.data.value, context)

    set(context, `${valueIdentifier}.${node.data.variable}`, output)

    controller.log({
        id: node.id,
        type: 'success',
        title: "State value has been updated",
        nodeType: node.type,
        payload: `${node.data.variable} = ${output}`
    });
    return nextNodes
}

export const Properties = ({ node }: { node: AppNode<SetStateData> }) => {
    const updateNode = useFlowStore(state => state.updateNode);

    const setValue = (key: string, value: string) => {
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.${key}`, value);
        updateNode(clonedNode);
    }

    const isValidCondition = useMemo(() => validateStatement(node.data.value),[node])

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
                <Label htmlFor="variable">Variable Name</Label>
                <Input
                    id='variable'
                    name="variable"
                    value={node.data.variable}
                    placeholder={"Variable name"}
                    onChange={(e) => setValue('variable', e.target.value)}
                />
            </div>
            <div className='flex flex-col gap-1'>
                <Label className='text-sm font-semibold' htmlFor="value">Value <span className={isValidCondition ? 'text-green-600': 'text-red-600'}>{isValidCondition ? '(Valid)' : '(Invalid)'}</span></Label>
                <Textarea
                    id="value"
                    name="value"
                    value={node.data.value}
                    classNameFrame={cn('h-20', isValidCondition ? 'outline !outline-green-600': 'outline !outline-red-600')}
                    placeholder='Enter your value statement here...'
                    onChange={(e) => setValue('value', e.target.value)}
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
