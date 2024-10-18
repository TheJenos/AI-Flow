import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Background, BackgroundVariant, getIncomers, MarkerType, NodeChange, NodeSelectionChange, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import CustomEdge from "./custom_edge";
import { getNodeDetails, NodeDetails, NodeOutput, nodeMap, NodeMetaData } from "@/lib/nodes";
import { useEffect, useMemo, useState } from "react";
import { AppNode, useFlowStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { Button } from "../ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/resizable";
import { Plus } from "lucide-react";
import { cn, trimStrings } from "@/lib/utils";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { validateStatement } from "@/lib/logics";

export default function ConditionEditorPopup({ baseNode, open, value, onChange, onClose }: { baseNode: AppNode, open: boolean, value?: string, onChange: (condition: string) => void, onClose: () => void }) {
    const [condition, setCondition] = useState<string>(value || '')

    useEffect(() => {
      setCondition(value || '')
    }, [value])

    const [selectedNode, setSelectedNode] = useState<{
        node: AppNode;
        nodeDetails: NodeDetails;
        outputs: NodeOutput;
    }>()
    const { oldNodes, oldEdges } = useFlowStore(useShallow((s) => ({
        oldNodes: s.nodes,
        oldEdges: s.edges
    })))

    const { nodes, edges } = useMemo(() => {
        const captureNodeIds: string[] = [];

        const nodesToProcess = [baseNode]
        while (nodesToProcess.length > 0) {
            const currentNode = nodesToProcess.pop()!;
            if (captureNodeIds.includes(currentNode.id)) continue;
            captureNodeIds.push(currentNode.id)
            if (currentNode.type == 'start') continue;
            const children = getIncomers(currentNode, oldNodes, oldEdges);
            nodesToProcess.push(...children);
        }

        return {
            nodes: oldNodes.filter(x => captureNodeIds.includes(x.id)).map(x => ({
                ...x,
                selectable: !!getNodeDetails(x.type).outputs,
            })),
            edges: oldEdges.filter(x => captureNodeIds.includes(x.source) && captureNodeIds.includes(x.target))
        }

    }, [baseNode, oldEdges, oldNodes])


    const onNodesChange = (changes: NodeChange[]) => {
        const selectedChange = changes.find(x => x.type == 'select' && (x as NodeSelectionChange).selected == true) as NodeSelectionChange | undefined

        if (selectedChange) {
            const node = nodes.find(x => x.id == selectedChange.id) as AppNode
            const nodeDetails = getNodeDetails(node?.type)
            if (nodeDetails.outputs) {
                const outputs = nodeDetails.outputs(node, {})
               setSelectedNode(selectedChange.selected ? { node, nodeDetails, outputs } : undefined)
            }
        }
    }

    const addDynamicValue = (node: AppNode, details: NodeMetaData, key: string) => {
        const valueIdentifier = details.valueIdentifier && details.valueIdentifier(node) || node.id
        setCondition(x => `${x}{${valueIdentifier}.${key}}`);
    }

    const isValidCondition = useMemo(() => validateStatement(condition),[condition])

    return (
        <Dialog open={open} onOpenChange={(state) => !state && onClose && onClose() }>
            <DialogContent className="max-w-screen-md">
                <DialogHeader>
                    <DialogTitle>Condition builder</DialogTitle>
                    <DialogDescription>Build conditions for node transitions</DialogDescription>
                </DialogHeader>
                <ResizablePanelGroup className="border" direction="horizontal">
                    <ResizablePanel defaultSize={60}>
                        <ReactFlowProvider>
                            <div className="w-full h-96">
                                <ReactFlow
                                    nodes={nodes}
                                    edges={edges}
                                    nodeTypes={nodeMap}
                                    edgeTypes={{
                                        default: CustomEdge
                                    }}
                                    onNodesChange={onNodesChange}
                                    defaultEdgeOptions={{
                                        markerEnd: {
                                            type: MarkerType.ArrowClosed,
                                            width: 15,
                                            height: 15,
                                        },
                                        style: {
                                            strokeWidth: 2,
                                        }
                                    }}
                                    snapToGrid
                                    snapGrid={[20, 20]}
                                    panOnDrag={false}
                                    panOnScroll={false}
                                    zoomOnPinch={false}
                                    zoomOnScroll={false}
                                    zoomOnDoubleClick={false}
                                    fitView
                                    fitViewOptions={{
                                        padding: 0.3
                                    }}
                                    maxZoom={1}
                                >
                                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                                </ReactFlow>
                            </div>
                        </ReactFlowProvider>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel maxSize={40} defaultSize={40} minSize={40}>
                        <div className="flex justify-center items-center h-full">
                            {selectedNode ? (
                                <div className="h-full">
                                    <div className="border-b border-gray-200 p-2">
                                        <h2 className="text-lg font-bold">{selectedNode.nodeDetails.name}</h2>
                                        <p className="text-sm text-gray-500">{selectedNode.nodeDetails.description}</p>
                                        <div className="mt-2 flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="font-semibold">Node ID : </span>
                                                <p className="text-gray-500">{selectedNode.node.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-full overflow-y-auto">
                                        {Object.keys(selectedNode.outputs).map(x => (
                                            <div key={x} className="flex items-center justify-between p-2 border-b border-gray-200">
                                                <div>
                                                    <h3 className="text-sm font-semibold">{selectedNode.outputs[x].title}</h3>
                                                    {selectedNode.outputs[x].description ? <p className="text-xs text-gray-500">{selectedNode.outputs[x].description}</p> : null}
                                                    {selectedNode.outputs[x].value ? <p className="text-xs text-gray-500">Current : {trimStrings(selectedNode.outputs[x].value.toString())}</p> : null}
                                                </div>
                                                <Button size="icon" variant="ghost" onClick={() => addDynamicValue(selectedNode.node, selectedNode.nodeDetails,x)} ><Plus /></Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">No node selected.</div>
                            )}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
                <DialogFooter className="items-end">
                    <div className="w-full">
                        <Label>Condition <span className={isValidCondition ? 'text-green-600': 'text-red-600'}>{isValidCondition ? '(Valid)' : '(Invalid)'}</span></Label>
                        <Input className={cn('mt-2', isValidCondition ? 'outline !outline-green-600': 'outline !outline-red-600')} valueHighlights value={condition} onChange={(e) => setCondition(e.target.value)} />
                    </div>
                    <DialogClose asChild>
                        <Button disabled={!isValidCondition} onClick={() => isValidCondition ? onChange(condition) : null}>Set Condition</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}