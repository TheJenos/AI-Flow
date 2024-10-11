import { NodeState } from "@/lib/nodes";
import { cn } from "@/lib/utils";
import { Check, CircleAlert, Clock, Loader } from "lucide-react";

export default function NoteIcon({state, idleIcon, className}: {state?: NodeState, idleIcon: React.ElementType, className?: string}) {
    const Icon = idleIcon;
    return (
        <div className="transition-opacity duration-300 ease-in-out">
            {(!state || state === 'idle') && <Icon className={cn(className, 'opacity-100')} />}
            {state === 'waiting' && <Clock className="opacity-100" />}
            {state === 'running' && <Loader className="animate-spin opacity-100" />}
            {state === 'completed' && <Check className="opacity-100" />}
            {state === 'failed' && <CircleAlert className="opacity-100" />}
        </div>
    );
}