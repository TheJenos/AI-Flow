import { Handle, NodeProps, Position } from '@xyflow/react';
import { Play } from 'lucide-react';
import { Card } from '../ui/card';

export default function StartNode({ isConnectable }: NodeProps) {
    return (
        <Card className="bg-green-600 bg-opacity-80 p-2 flex gap-2 items-center text-white">
            <Play /> <span className='font-semibold'>Start</span>
           {isConnectable ? <Handle
                type="source"
                position={Position.Bottom}
                className='!rounded-md !w-1/5 !h-2 max-w-auto max-h-auto bg-primary'
            /> : null }
        </Card>
    );
}