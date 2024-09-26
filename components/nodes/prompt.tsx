import { NodeProps } from '@xyflow/react';
import { ScrollText } from 'lucide-react';
import { Card } from '../ui/card';
import { NodeMetaData, NodeState } from '@/lib/nodes';
import useFlowStore, { AppNode } from '@/lib/store';
import { cloneDeep, set } from 'lodash';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { useMemo } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import NoteIcon from '../node_icon';
import { ThreadSourceHandle, ThreadTargetHandle } from '../thread_handle';

export const Metadata: NodeMetaData = {
    type: 'prompt',
    name: 'Open AI Chat Prompt',
    description: 'Generate a response based on the given prompt'
}

export const Process = async (context: { [key: string]: string | number | object }, node: AppNode) => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5000));
    console.log("prompt node", node.data.name, 'context', context, 'node', node);
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
            <div className='flex flex-col gap-1'>
                <Label className='text-sm font-semibold' htmlFor="model">Model</Label>
                <Select name="model" value={node.data.model as string} onValueChange={(e) => setValue('model', e)}>
                    <SelectTrigger>
                        <SelectValue id="model" placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className='flex flex-col gap-1'>
                <Label className='text-sm font-semibold' htmlFor="prompt">Prompt</Label>
                <Textarea
                    id="prompt"
                    name="prompt"
                    value={node.data.prompt as string}
                    className='h-20'
                    placeholder='Enter your prompt here...'
                    onChange={(e) => setValue('prompt', e.target.value)}
                />
            </div>
        </div>
    )
}

const noteStateVariants = cva(
    "bg-red-600 p-2 flex gap-2 rounded-none items-center text-white transition-all duration-300",
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
        return (data?.name || 'Prompt') as string;
    }, [data?.name]);

    const state = (data.state || 'idle') as NodeState;
    const thread = (data.thread || 'not found') as string;

    return (
        <Card className={cn(noteStateVariants({ state }))}>
            <ThreadTargetHandle active={isConnectable} />
            <NoteIcon state={state} idleIcon={ScrollText} /> <span className='text-sm font-semibold'>{name} {thread}</span>
            <ThreadSourceHandle active={isConnectable} />
        </Card>
    );
}
