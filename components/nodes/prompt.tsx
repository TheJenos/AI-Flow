import { Plus, ScrollText, Trash } from 'lucide-react';
import { AppContext, NodeMetaData, NodeOutput, OutputExtra, Controller, NodeLogViewProps } from '@/lib/nodes';
import { useFlowStore, AppNode, AppNodeProp, NodeData, } from '@/lib/stores/flow_store';
import { useSettingStore } from '@/lib/stores/settings_store';
import { useRuntimeStore } from '@/lib/stores/runtime_store';
import { capitalize, cloneDeep, set } from 'lodash';
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
import { ChatCompletion, Message, modelDetails, OpenAi, OpenAiFaker, openAiTokenToCost } from '@/lib/openai';
import { replaceDynamicValueWithActual } from '@/lib/logics';
import { Stats } from '../node_utils/stats';
import MarkdownViewer from '../ui/markdown_viewer';
import { Slider } from '../ui/slider';
import SchemaEditor, { SchemaType } from '../ui/schema_editor';
import { AxiosError } from 'axios';

type PromptData = NodeData & {
    model: string
    system_prompt: string
    prompts: Message[]
    response_format: 'text' | 'json_object' | 'json_schema'
    response_schema: {
        schema: {
            properties: {
                [key: string]: {
                    title: string
                    description: string
                }
            }
        }
    },
    test_output?: string
}

export const Metadata: NodeMetaData = {
    type: 'prompt',
    name: 'OpenAI Chat Prompt',
    description: 'Generate a response based on the given prompt',
    tags: ['OpenAI', 'ChatGPT', 'prompt']
}

type LogViewPayload = {
    assistant_output: string
    usage: ChatCompletion['usage']
    amount: number
    startTime: number
    endTime: number
}

export function LogView({ payload }: NodeLogViewProps<LogViewPayload>) {
    return <>
        <MarkdownViewer text={payload.assistant_output} />
        <Stats amount={payload.amount} outToken={payload.usage.prompt_tokens} inToken={payload.usage.completion_tokens} startTime={payload.startTime} endTime={payload.endTime} />
    </>;
}

export const Outputs = (node: AppNode<PromptData>, extra: OutputExtra) => {
    const outputs = {
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
        system_prompt: {
            title: 'System Prompt',
            description: 'System prompt used in the node',
            value: node.data.system_prompt
        },
        assistant_raw_output: {
            title: 'Assistant Raw Output',
            description: 'Raw assistant output that getting from the response',
            value: extra.assistant_raw_output
        },
    } as NodeOutput

    if (node.data.response_format == 'json_schema') {
        const props = node.data.response_schema?.schema.properties || {}

        outputs['assistant_json_output'] = {
            title: 'Assistant Json Output',
            description: 'JSON formatted output from the assistant',
            value: extra.assistant_json_output as string
        }

        for (const key in props) {
            outputs[`assistant_json_output.${key}`] = {
                title: props[key].title as unknown as string || `${capitalize(key)} Value`,
                description: props[key].description as unknown as string || 'This value will set from the output structure',
                value: extra.assistant_json_output ? (extra.assistant_json_output as Record<string, unknown>)[key] as string : undefined
            }
        }
    }

    return outputs
}

export const Process = async (context: AppContext, node: AppNode<PromptData>, nextNodes: AppNode[], controller: Controller) => {
    const token = useSettingStore.getState().openAIKey
    const isTestAPI = useSettingStore.getState().devMode?.testOpenAPI || false
    if (!isTestAPI && !token) throw Error("You need to add OpenAI Token in the setting to continue or you can use test api on dev mode for testing")

    const test_output = node.data.test_output
    if (isTestAPI && !test_output) throw Error("Test Output is required")

    const model = node.data.model
    if (!model) throw Error("Model type is required")

    const systemPrompt = node.data.system_prompt
    if (!systemPrompt) throw Error("System prompt is required")

    const response_format = node.data.response_format
    const response_schema = node.data.response_schema
    if (response_format && response_format == 'json_schema' && !response_schema) throw Error("Output structure is required")

    const client = isTestAPI ? OpenAiFaker(test_output) : OpenAi(token)

    const otherPrompts = node.data.prompts || []

    const messages = [
        {
            role: 'system',
            content: systemPrompt
        },
        ...otherPrompts
    ] as Message[]

    const startTime = new Date().getTime();

    let response = null
    try {
        response = await client.chat({
            model,
            temperature: node.data.temperature as number || 1,
            top_p: node.data.top_p as number || 1,
            messages: messages.map(x => ({
                ...x,
                content: replaceDynamicValueWithActual(x.content || '', context)
            })),
            response_format: { type: response_format || 'text', json_schema: response_schema }
        })
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data?.error?.message) {
            throw new Error(error.response?.data?.error?.message);
        } else {
            throw error;
        }
    }

    const endTime = new Date().getTime();
    const amount = openAiTokenToCost(response.data.usage.total_tokens, model)
    const output = response.data.choices[0].message.content

    controller.log({
        id: node.id,
        type: 'success',
        title: "Request successfully executed",
        nodeType: node.type,
        payload: {
            assistant_output: (response_format || 'text') != 'text' ? JSON.stringify(JSON.parse(output || '{}'), null, 2) : output,
            usage: response.data.usage,
            amount,
            startTime,
            endTime
        }
    });

    controller.increaseOutToken(response.data.usage.prompt_tokens)
    controller.increaseInToken(response.data.usage.completion_tokens)
    controller.increaseAmount(amount)

    context[node.id] = Object.fromEntries(Object.entries(Outputs(node, {
        assistant_raw_output: output,
        assistant_json_output: (response_format || 'text') != 'text' ? JSON.parse(output || '{}') : undefined
    })).map(([key, value]) => [key, value.value]))

    return nextNodes
}

export const Properties = ({ node }: { node: AppNode<PromptData> }) => {
    const isTestAPI = useSettingStore((s) => s.devMode?.testOpenAPI || false)
    const updateNode = useFlowStore(state => state.updateNode);
    const [selectedType, setSelectedType] = useState<string>();
    const [deletePrompt, setDeletePrompt] = useState<number>();
    const [prompts, setPrompts] = useState(node.data.prompts || []);

    const setValue = (key: string, value: string | number | SchemaType) => {
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

        const updatedPrompts = prompts.filter((_, i) => i != promptIndex);
        setDeletePrompt(undefined);
        setPrompts(updatedPrompts);
        const clonedNode = cloneDeep(node);
        set(clonedNode, 'data.prompts', updatedPrompts);
        updateNode(clonedNode);
    };

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
                <Label className='text-sm font-semibold' htmlFor="model">Model</Label>
                <Select name="model" value={node.data.model} onValueChange={(e) => setValue('model', e)}>
                    <SelectTrigger>
                        <SelectValue id="model" placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        {modelDetails.map((x, index) => (
                            <SelectItem key={index} value={x.title}>{x.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className='flex flex-col gap-1'>
                <Label className='text-sm font-semibold flex'>Response Format</Label>
                <Select
                    name='type'
                    required
                    value={node.data.response_format as string || 'text'}
                    onValueChange={(e) => setValue('response_format', e)}
                >
                    <SelectTrigger>
                        <SelectValue className='w-full' placeholder="Response Format" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="json_object">JSON Object</SelectItem>
                        <SelectItem value="json_schema">JSON Schema</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {node.data.response_format == 'json_schema' ? <div className='flex flex-col gap-1'>
                <Label className='text-sm font-semibold flex'>Output structure</Label>
                <SchemaEditor defaultValue={node.data.response_schema as SchemaType} onSave={(e) => setValue('response_schema', e)} />
            </div> : null}
            <div className='flex flex-col gap-1'>
                <Label className='text-sm font-semibold flex'>Temperature <div className='ml-auto'>{node.data.temperature === undefined ? 1 : node.data.temperature as string }</div></Label>
                <Slider defaultValue={[node.data.temperature === undefined ? 1 : node.data.temperature as number]} max={2} min={0} step={0.01} onValueChange={(e) => setValue('temperature', e[0])} />
            </div>
            <div className='flex flex-col gap-1'>
                <Label className='text-sm font-semibold flex'>Top P <div className='ml-auto'>{node.data.top_p === undefined ? 1 : node.data.top_p as string}</div></Label>
                <Slider defaultValue={[node.data.top_p === undefined ? 1 : node.data.top_p as number]} max={1} min={0} step={0.01} onValueChange={(e) => setValue('top_p', e[0])} />
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
                    node={node}
                />
            </div>
            {prompts.map((prompt, index) => (
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
                        node={node}
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
                        <SelectTrigger>
                            <SelectValue className='w-full' placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="assistant">Assistant</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className='w-10' size={'icon'} type="submit">
                        <Plus className='w-4 h-4' />
                    </Button>
                </div>
            </form>
            {isTestAPI ? <div className='flex flex-col gap-1'>
                <Label className='text-sm font-semibold' htmlFor="test_output">Test Output</Label>
                <Textarea
                    id="test_output"
                    name="test_output"
                    type={ ['json_schema','json_object'].includes(node.data.response_format) ? 'json' : 'text'}
                    value={node.data.test_output}
                    className='h-20'
                    schema={node.data.response_format == 'json_schema' ? node.data.response_schema.schema : undefined}
                    placeholder='Enter your output here...'
                    onChange={(e) => setValue('test_output', e.target.value)}
                    withoutHighlights
                />
            </div> : null}
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

export function Node({ id, selectable, isConnectable, data }: AppNodeProp) {
    const state = useRuntimeStore((state) => selectable != undefined && !selectable ? "faded" : state.nodeStates[id])
    const name = useMemo(() => {
        return (data?.name || Metadata.name) as string;
    }, [data?.name]);

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
