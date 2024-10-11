import { AppNode, useFlowStore, useRuntimeStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader } from "../ui/card"
import { useMemo } from "react";
import { getNodeDetails, NodeLogView } from "@/lib/nodes";
import { Crosshair } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useShallow } from "zustand/shallow";
import { Badge } from "../ui/badge";
import { Stats } from "./stats";

export default function RuntimeLogs() {
    const { startTime, endTime, inToken, outToken, amount, logs } = useRuntimeStore(useShallow((state) => ({
        logs: state.logs,
        startTime: state.startTime,
        endTime: state.endTime,
        inToken: state.inToken,
        outToken: state.outToken,
        amount: state.amount
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
            duration: 300
        })
        onNodesChange([{ type: 'select', id: node.id, selected: true }])
    }

    return (
        <div className="flex flex-col h-screen">
            <div className="border-b border-gray-200 p-2">
                <h2 className="font-bold">Runtime Logs</h2>
                <p className="text-xs text-gray-500">This section displays the logs generated during the runtime of the flow, providing insights into the flows&apos;s operations and any potential issues.</p>
                <Stats startTime={startTime} endTime={endTime} inToken={inToken} outToken={outToken} amount={amount} />
            </div>
            <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
                {logsWithDetails.map((x, index) => {
                    const NodeLogView = x.details.logView as NodeLogView

                    return (
                        <Card key={index}>
                            <CardHeader className="p-3">
                                <div className="flex flex-row items-center gap-2">
                                    <div className="flex-1">
                                        <div className="text-sm font-bold flex items-center break-words w-full">{x.node?.id == 'start' ? "Start" : x.node?.data.name || x.details.name}</div>
                                        {x.node?.id != 'start' ? <CardDescription className="text-xs">{x.node?.id}</CardDescription> : null}
                                    </div>
                                    {x.type != 'info' ? <Badge size="small" variant={x.type} className="ml-auto">{x.type}</Badge> : null}
                                    {x.node ? <Crosshair size={16} className="ml-auto" onClick={() => focusNode(x.node as AppNode)} /> : null}
                                </div>
                                <CardDescription className="text-xs mt-2">{x.title}</CardDescription>
                            </CardHeader>
                            {x.payload ? <CardContent className="p-3 pt-0">
                                { x.details.logView ? <NodeLogView node={x.node} payload={x.payload} /> : JSON.stringify(x.payload) }
                            </CardContent> : null }
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}