import { Plus, ScrollText, Trash } from 'lucide-react';
import { AppContext, NodeMetaData, NodeOutput, NodeState, OutputExtra, Controller } from '@/lib/nodes';
import { useFlowStore, AppNode, AppNodeProp, NodeData, useSettingStore } from '@/lib/store';
import { cloneDeep, set } from 'lodash';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { useMemo, useState } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import NoteIcon from '../node_utils/node_icon';
import { ThreadSourceHandle, ThreadTargetHandle } from '../node_utils/thread_handle';
import DevMode from '../node_utils/dev_mode';
import { Button } from '../ui/button';
import ConfirmAlert from '../ui/confirm_alert';
import { Message, modelDetails, OpenAi, OpenAiFaker, openAiTokenToCost } from '@/lib/openai';

type PromptData = NodeData & {
    model: string,
    system_prompt: string
    prompts: Message[]
}

export const Metadata: NodeMetaData = {
    type: 'prompt',
    name: 'OpenAI Chat Prompt',
    description: 'Generate a response based on the given prompt',
    tags: ['OpenAI', 'ChatGPT', 'prompt']
}

export const Outputs = (node: AppNode<PromptData>, extra: OutputExtra) => {
    return {
        name: {
            title: 'Node name',
            description: 'Name used in the node',
            value: node.data.name
        },
        model_name: {
            title: 'Model Name',
            description: 'Model used in the node',
            value: node.data.model
        },
        system_promp: {
            title: 'System Prompt',
            description: 'Syetem prompt used in the node',
            value: node.data.system_prompt
        },
        assistant_output: {
            title: 'Assistant Output',
            description: 'Assistant output that getting from the reponse',
            value: extra.assistant_output
        },
    } as NodeOutput
}

export const Process = async (context: AppContext, node: AppNode<PromptData>, nextNodes: AppNode[], controller: Controller) => {
    const token = useSettingStore.getState().openAIKey
    const isTestAPI = useSettingStore.getState().devMode?.testOpenAPI || false
    if (!isTestAPI && !token) throw Error("You need to add OpenAI Token in the setting to continue or you can use test api on dev mode for testing")

    const model = node.data.model
    if (!model) throw Error("Model type is requried")

    const systemPrompt = node.data.system_prompt
    if (!systemPrompt) throw Error("System prompt is requried")

    const client = isTestAPI ? OpenAiFaker() : OpenAi(token)

    const otherPrompts = node.data.prompts

    const messages = [
        {
            role: 'system',
            content: systemPrompt
        },
        ...otherPrompts
    ] as Message[]

    const response = await client.chat({
        model,
        messages
    })

    controller.increaseOutToken(response.data.usage.prompt_tokens)
    controller.increaseInToken(response.data.usage.completion_tokens)
    controller.increaseAmount(openAiTokenToCost(response.data.usage.total_tokens, model))

    context[node.id] = Object.fromEntries(Object.entries(Outputs(node, {
        assistant_output: response.data.choices[0].message.content
    })).map(([key, value]) => [key, value.value]))

    return nextNodes
}

export const Properties = ({ node }: { node: AppNode<PromptData> }) => {
    const updateNode = useFlowStore(state => state.updateNode);
    const [selectedType, setSelectedType] = useState<string>();
    const [deletePrompt, setDeletePrompt] = useState<number>();
    const [prompts, setPrompts] = useState(node.data.prompts || []);

    const setValue = (key: string, value: string) => {
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.${key}`, value);
        updateNode(clonedNode);
    }

    const setPromptValue = (index: number, value: string) => {
        const clonePrompts = cloneDeep(prompts);
        clonePrompts[index].content = value
        setPrompts(clonePrompts)
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.prompts.${index}.content`, value);
        updateNode(clonedNode);
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const newProperty = {
            role: formData.get('type') as 'user' | 'assistant'
        };
        setPrompts([...prompts, newProperty]);
        const clonedNode = cloneDeep(node);
        set(clonedNode, 'data.prompts', [...prompts, newProperty]);
        updateNode(clonedNode);
        setSelectedType(undefined);
        (e.target as HTMLFormElement).reset();
    };

    const handleDelete = (promptIndex?: number, force: boolean = false) => {
        if (!force && promptIndex != undefined && prompts[promptIndex].content) {
            setDeletePrompt(promptIndex);
            return;
        }

        const updatedPrompts = prompts.filter((_,i) => i != promptIndex);
        setDeletePrompt(undefined);
        setPrompts(updatedPrompts);
        const clonedNode = cloneDeep(node);
        set(clonedNode, 'data.prompts', updatedPrompts);
        updateNode(clonedNode);
    };

    return (
        <div className='flex flex-col gap-2 px-2'>
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
                <Label className='text-sm font-semibold' htmlFor="model">Model</Label>
                <Select name="model" value={node.data.model} onValueChange={(e) => setValue('model', e)}>
                    <SelectTrigger>
                        <SelectValue id="model" placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>                       
                        {modelDetails.map((x,index) => (
                            <SelectItem key={index} value={x.title}>{x.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className='flex flex-col gap-1'>
                <Label className='text-sm font-semibold' htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                    id="system_prompt"
                    name="system_prompt"
                    value={node.data.system_prompt}
                    className='h-20'
                    placeholder='Enter your system prompt here...'
                    onChange={(e) => setValue('system_prompt', e.target.value)}
                />
            </div>
            {prompts.map((prompt,index) => (
                <div key={index} className='flex flex-col gap-1'>
                    <div className='flex'>
                        <Label className='text-sm font-semibold' htmlFor="system_prompt">{prompt.role == 'user' ? "User" : "Assistant"} Prompt</Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(index)}
                            className="text-red-500 hover:text-red-700 p-0.5 h-6 w-6 ml-auto"
                        >
                            <Trash className='w-4 h-4' />
                        </Button>
                    </div>
                    <Textarea
                        id="prompt"
                        name="prompt"
                        value={prompt.content}
                        className='h-20'
                        placeholder='Enter your prompt here...'
                        onChange={(e) => setPromptValue(index, e.target.value)}
                    />
                </div>
            ))}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <span className='text-sm font-semibold'>Add Prompt section</span>
                <div className='flex gap-2'>
                    <Select
                        name='type'
                        required
                        value={selectedType}
                        onValueChange={(e) => setSelectedType(e)}
                    >
                        <SelectTrigger className='h-8'>
                            <SelectValue className='w-full h-8' placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="assistant">Assistant</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className='w-10 h-8' size={'icon'} type="submit">
                        <Plus className='w-4 h-4' />
                    </Button>
                </div>
            </form>
            <ConfirmAlert
                open={deletePrompt != undefined}
                title="Delete prompt"
                description="Are you sure you want to delete this prompt?"
                onConfirm={() => handleDelete(deletePrompt, true)}
                onCancel={() => setDeletePrompt(undefined)}
            />
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

export function Node({ isConnectable, data }: AppNodeProp) {
    const name = useMemo(() => {
        return (data?.name || Metadata.name) as string;
    }, [data?.name]);

    const state = (data.state || 'idle') as NodeState;

    return (
        <div className={cn(noteStateVariants({ state }))}>
            <ThreadTargetHandle active={isConnectable} />
            <div className='flex gap-2'>
                <NoteIcon state={state} idleIcon={ScrollText} />
                <span className='text-sm font-semibold'>{name}</span>
            </div>
            <DevMode data={data} />
            <ThreadSourceHandle active={isConnectable} />
        </div>
    );
}
