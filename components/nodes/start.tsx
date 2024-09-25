import { Handle, NodeProps, Position } from '@xyflow/react';
import { PlayCircle, Plus, Trash } from 'lucide-react';
import { Card } from '../ui/card';
import { useState } from 'react';
import useFlowStore, { AppNode } from '@/lib/store';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

export const Properties = ({ node }: { node: AppNode }) => {
    const existingProperties = (node.data.properties || []) as { name: string; type: string }[];
    const [properties, setProperties] = useState<{ name: string; type: string }[]>(existingProperties);
    const updateNode = useFlowStore(state => state.updateNode);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const newProperty = {
            name: formData.get('name') as string,
            type: formData.get('type') as string
        };
        setProperties([...properties, newProperty]);
        updateNode({
            ...node,
            data: {
                ...node.data,
                properties: [...properties, newProperty]
            }
        });
        (e.target as HTMLFormElement).reset();
    };

    const handleDelete = (index: number) => {
        const updatedProperties = properties.filter((_, i) => i !== index);
        setProperties(updatedProperties);
        updateNode({
            ...node,
            data: {
                ...node.data,
                properties: updatedProperties
            }
        });
    };

    const renderInput = (prop: { name: string; type: string }) => {
        switch (prop.type) {
            case 'textarea':
                return <Textarea id={prop.name} className='h-20 w-full p-2' placeholder={prop.name} />;
            case 'radio':
                return (
                    <div className='flex gap-2'>
                        <input type='radio' id={`${prop.name}-yes`} name={prop.name} value='yes' />
                        <label htmlFor={`${prop.name}-yes`}>Yes</label>
                        <input type='radio' id={`${prop.name}-no`} name={prop.name} value='no' />
                        <label htmlFor={`${prop.name}-no`}>No</label>
                    </div>
                );
            case 'checkbox':
                return <input id={prop.name} type='checkbox' />;
            default:
                return <Input id={prop.name} className='h-8' type={prop.type} placeholder={prop.name} />;
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
                            onClick={() => handleDelete(index)}
                            className="text-red-500 hover:text-red-700 p-0.5 h-6 w-6 ml-auto"
                        >
                            <Trash className='w-4 h-4' />
                        </Button>
                    </div>
                    {prop.type == 'checkbox' ? null : renderInput(prop)}
                </div>
            ))}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <span className='text-xs font-semibold'>Add Property</span>
                <div className='flex gap-2'>
                    <Input
                        type="text"
                        placeholder="Name"
                        name="name"
                        required
                        className='h-8'
                    />
                    <Select
                        name='type'
                        required
                    >
                        <SelectTrigger className='h-8'>
                            <SelectValue className='w-full h-8' placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="radio">Radio</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button className='w-24 h-8' size={'icon'} type="submit">
                        <Plus className='w-4 h-4' />
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default function StartNode({ isConnectable }: NodeProps) {
    return (
        <Card className="bg-green-600 bg-opacity-70 px-3 py-2 flex gap-2 items-center rounded-3xl text-white">
            <PlayCircle /> <span className='text-sm font-semibold'>Start</span>
            {isConnectable ? <Handle
                type="source"
                position={Position.Bottom}
                className='!rounded-md !w-1/5 !h-2 max-w-auto max-h-auto bg-primary'
            /> : null}
        </Card>
    );
}