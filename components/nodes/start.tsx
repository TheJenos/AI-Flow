import { PlayCircle, Plus, Trash } from 'lucide-react';
import { Card } from '../ui/card';
import { useState } from 'react';
import { useFlowStore, AppNode, AppNodeProp } from '@/lib/store';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { set, cloneDeep } from 'lodash'
import ConfirmAlert from '../confirm_alert';
import { AppContext, NodeMetaData, NodeState } from '@/lib/nodes';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ThreadSourceHandle } from '../thread_handle';
import DevMode from '../dev_mode';

type Property = { name: string; type: string };

export const Metadata: NodeMetaData = {
    type: 'start',
    name: 'Start',
    description: 'The first node in the flow. Please add a your initial values here.',
    notAddable: true
}

export const Process = async (context: AppContext, node: AppNode, nextNodes: AppNode[]) => {
    console.log("start node",'context', context, 'node', node);
    context['run'] =0;
    return nextNodes
}

export const Properties = ({ node }: { node: AppNode }) => {
    const existingProperties = (node.data.properties || []) as Property[];
    const existingPropertyValues = (node.data.propertyValues || {}) as { [key: string]: string | number | undefined };

    const [deleteProperty, setDeleteProperty] = useState<Property>();
    const [properties, setProperties] = useState<Property[]>(existingProperties);
    const [propertyValues, setPropertyValues] = useState<{ [key: string]: string | number | undefined }>(existingPropertyValues);
    const [selectedType, setSelectedType] = useState<string>();

    const updateNode = useFlowStore(state => state.updateNode);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const newProperty = {
            name: formData.get('name') as string,
            type: formData.get('type') as string
        };
        setProperties([...properties, newProperty]);
        const clonedNode = cloneDeep(node);
        set(clonedNode, 'data.properties', [...properties, newProperty]);
        updateNode(clonedNode);
        setSelectedType(undefined);
        (e.target as HTMLFormElement).reset();
    };

    const handleDelete = (prop: Property, force: boolean = false) => {
        if (!force && propertyValues[prop.name]) {
            setDeleteProperty(prop);
            return;
        }

        const updatedProperties = properties.filter((p) => p.name !== prop.name);
        setDeleteProperty(undefined);
        setProperties(updatedProperties);
        setPropertyValues({
            ...propertyValues,
            [prop.name]: undefined
        });
        const clonedNode = cloneDeep(node);
        set(clonedNode, 'data.properties', updatedProperties);
        set(clonedNode, `data.propertyValues.${prop.name}`, undefined);
        updateNode(clonedNode);
    };

    const renderInput = (prop: { name: string; type: string }) => {
        const value = propertyValues[prop.name] || '';
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setPropertyValues({
                ...propertyValues,
                [prop.name]:  e.target.value
            });
            const clonedNode = cloneDeep(node);
            set(clonedNode, `data.propertyValues.${prop.name}`,  e.target.value);
            updateNode(clonedNode);
        };
        
        switch (prop.type) {
            case 'textarea':
                return <Textarea id={prop.name} className='' placeholder={prop.name} value={value} onChange={handleChange} />;
            case 'checkbox':
                return <input id={prop.name} type='checkbox' checked={value === 'yes'} onChange={handleChange} />;
            default:
                return <Input id={prop.name} className='h-8' type={prop.type} placeholder={prop.name} value={value} onChange={handleChange} />;
        }
    };

    return (
        <div className='px-2 flex flex-col gap-2'>
            {properties.map((prop, index) => (
                <div key={index} className="flex flex-col pb-2 border-b border-gray-200">
                    <div className="flex items-center mb-1 gap-2">
                        <Label className='text-sm font-semibold' htmlFor={prop.name}>{prop.name}</Label>
                        {prop.type == 'checkbox' ? renderInput(prop) : null}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(prop)}
                            className="text-red-500 hover:text-red-700 p-0.5 h-6 w-6 ml-auto"
                        >
                            <Trash className='w-4 h-4' />
                        </Button>
                    </div>
                    {prop.type == 'checkbox' ? null : renderInput(prop)}
                </div>
            ))}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <span className='text-xs font-semibold'>Add Inputs</span>
                <div className='flex gap-2'>
                    <Input
                        type="text"
                        placeholder="Name"
                        name="name"
                        required
                        className='h-8'
                        autoComplete='off'
                    />
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
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className='w-24 h-8' size={'icon'} type="submit">
                        <Plus className='w-4 h-4' />
                    </Button>
                </div>
            </form>
            <ConfirmAlert
                open={!!deleteProperty}
                title="Delete property"
                description="Are you sure you want to delete this property?"
                onConfirm={() => handleDelete(deleteProperty as Property, true)}
                onCancel={() => setDeleteProperty(undefined)}
            />
        </div>
    );
};

const noteStateVariants = cva(
    "bg-green-600 bg-opacity-70 px-3 py-2 flex flex-col gap-2 items-center rounded-3xl text-white",
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
    const state = (data.state || 'idle') as NodeState;

    return (
        <Card className={cn(noteStateVariants({ state }))}>
            <div className='flex gap-2'>
                <PlayCircle /> 
                <span className='text-sm font-semibold'>Start</span>
            </div>
            <DevMode data={data}/>
            <ThreadSourceHandle active={isConnectable} />
        </Card>
    );
}