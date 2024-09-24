import { cn } from '@/lib/utils';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { cva } from 'class-variance-authority';
import { Home } from 'lucide-react';

const startNodeVariants = cva(
    "bg-green-600 bg-opacity-80 border border-black rounded-lg p-2 flex gap-2 items-center text-white",
    {
        variants: {
            selected: {
                true: "outline outline-2 outline-offset-1 outline-primary",
                false: "",
            }
        },
        defaultVariants: {
            selected: false,
        },
    }
)

function StartNode({ selected }: NodeProps) {
    return (
        <div className={cn(startNodeVariants({ selected }))}>
            <Home /> <span className='font-semibold'>Start</span>
            <Handle
                type="source"
                position={Position.Bottom}
                className='!rounded-md !w-1/3 !h-2 max-w-auto max-h-auto bg-primary'
            />
        </div>
    );
}

export default StartNode;
