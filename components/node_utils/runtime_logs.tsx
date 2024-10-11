import { AppNode, useFlowStore, useRuntimeStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card"
import { useEffect, useMemo, useState } from "react";
import { getNodeDetails, NodeOutputView } from "@/lib/nodes";
import { ArrowUpDown, Crosshair, DollarSign, MoveDown, MoveUp, Timer } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useShallow } from "zustand/shallow";

export default function RuntimeLogs() {
    const [duration, setDuration] = useState<string>("00:00.000")
    const { startTime, endTime, inToken, outToken, amount, logs } = useRuntimeStore(useShallow((state) => ({
        logs: state.logs,
        startTime: state.startTime,
        endTime: state.endTime,
        inToken: state.inToken,
        outToken: state.outToken,
        amount: String(state.amount.toFixed(6)).padStart(7, '0'),
    })))
    const { nodes, onNodesChange } = useFlowStore(useShallow((state) => ({ nodes: state.nodes, onNodesChange: state.onNodesChange })))

    const { fitView, } = useReactFlow()

    const logsWithDetails = useMemo(() => logs.map(x => ({
        ...x,
        node: nodes.find(y => y.id == x.id),
        details: getNodeDetails(x.nodeType)
    })), [logs, nodes]);

    const focusNode = (node: AppNode) => {
        fitView({
            nodes: [node],
            maxZoom: 1.5,
        })
        onNodesChange([{ type: 'select', id: node.id, selected: true }])
    }

    const coveterDuration = (start?: number, end?: number) => {
        if (!start) return `00:00.000`
        const duration = (end ?? Date.now()) - start;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        const milliseconds = Math.floor(duration % 1000);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
    }

    useEffect(() => {
        if (!startTime || endTime) {
            setDuration(coveterDuration(startTime, endTime))
            return
        }

        const interval = setInterval(() => setDuration(coveterDuration(startTime)), 10);
        return () => clearInterval(interval);
    }, [startTime, endTime]);

    return (
        <div className="flex flex-col h-screen">
            <div className="border-b border-gray-200 p-2">
                <h2 className="font-bold">Runtime Logs</h2>
                <p className="text-xs text-gray-500">This section displays the logs generated during the runtime of the flow, providing insights into the flows&apos;s operations and any potential issues.</p>
                <div className="flex gap-2 items-center justify-between text-xs bg-accent mt-2 p-2 rounded-md">
                    <div className="flex items-center gap-1"><MoveUp size={16} /> {inToken}</div>
                    <div className="flex items-center gap-1"><MoveDown size={16} /> {outToken}</ div>
                    <div className="flex items-center gap-1"><ArrowUpDown size={16} /> {inToken + outToken}</ div>
                    <div className="flex items-center gap-1"><DollarSign size={16} /> {amount}</div>
                    <div className="flex items-center gap-1"><Timer size={16} /> {duration}</div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto py-3 px-2">
                {logsWithDetails.map((x, index) => {
                    const NodeOutputView = x.details.outputView as NodeOutputView

                    return (
                        <Card key={index}>
                            <CardHeader className="p-3 space-y-0">
                                <div className="flex flex-row items-center">
                                    <div className="text-sm font-bold">{x.node?.data.name || x.details.name} ({x.node?.id})</div>
                                    {x.node ? <Crosshair size={14} className="ml-auto" onClick={() => focusNode(x.node as AppNode)} /> : null}
                                </div>
                                <CardDescription className="text-xs">{x.title}</CardDescription>
                            </CardHeader>
                            {x.payload ? <CardContent className="p-3">
                                { x.details.outputView ? <NodeOutputView node={x.node} payload={x.payload} /> : JSON.stringify(x.payload) }
                            </CardContent> : null }
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}