import { CircleHelp, PenBox } from 'lucide-react';
import { Card } from '../ui/card';
import { AppContext, getNodeDetails, NodeMetaData, NodeState, StatsUpdater } from '@/lib/nodes';
import { useFlowStore, AppNode, AppNodeProp } from '@/lib/store';
import { cloneDeep, get, set } from 'lodash';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useMemo, useState } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import NoteIcon from '../node_utils/node_icon';
import { ThreadSourceHandle, ThreadTargetHandle } from '../node_utils/thread_handle';
import DevMode from '../node_utils/dev_mode';
import { useShallow } from 'zustand/shallow';
import { getOutgoers } from '@xyflow/react';
import { runStatement } from '@/lib/logics';
import { Button } from '../ui/button';
import ConditionEditorPopup from '../node_utils/condition_editor_popup';

export const OnDisconnect = async (node: AppNode, otherNode: AppNode, updates: { [key: string]: unknown }) => {
    set(updates, `${node.id}.decisions`, Object.fromEntries(Object.entries(node.data.decisions as object).filter(([key]) => key != otherNode.id)))
}

export const Metadata: NodeMetaData = {
    type: 'decision',
    name: 'Decision',
    description: 'A node that signifies a decision point in the flow. Only one condition will be effective even if multiple conditions are true.',
    tags: ['if', 'question', 'condition'],
    OnDisconnect,
}

export const Process = async (context: AppContext, node: AppNode, nextNodes: AppNode[], statsUpdater: StatsUpdater) => {
    statsUpdater.log("decision node", 'context', context, 'node', node);

    const allDecisions = (node.data.decisions || {}) as {
        [key: string]: {
            name: string;
            condition: string;
        }
    }

    const nextNode = nextNodes.find(nextNode => {
        if (nextNode.id in allDecisions && allDecisions[nextNode.id].condition && allDecisions[nextNode.id].condition != 'else') {
            return runStatement(allDecisions[nextNode.id].condition, context)
        }
    }) || nextNodes.find(nextNode => nextNode.id in allDecisions && allDecisions[nextNode.id].condition && allDecisions[nextNode.id].condition == 'else')

    return nextNode ? [nextNode] : []
}

export const Properties = ({ node }: { node: AppNode }) => {
    const [conditionEditorNode, setConditionEditorNode] = useState<{
        nodeId: string
        condition?: string
    }>()

    const { updateNode, updateEdge, nodes, edges } = useFlowStore(useShallow(state => ({
        updateNode: state.updateNode,
        updateEdge: state.updateEdge,
        nodes: state.nodes,
        edges: state.edges
    })));

    const setValue = (key: string, value: string) => {
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.${key}`, value);
        updateNode(clonedNode);
    }

    const updateDecisionEdge = (clonedNode: AppNode, targetNodeId: string) => {
        const currentEdge = edges.find(x => x.source == node.id && x.target == targetNodeId)
        if (!currentEdge) return;
        const clonedEdge = cloneDeep(currentEdge);
        const haveLogic = !!get(clonedNode, `data.decisions.${targetNodeId}.condition`);
        const haveName = !!get(clonedNode, `data.decisions.${targetNodeId}.name`);
        const label = get(clonedNode, `data.decisions.${targetNodeId}.name`);

        const error = haveLogic && haveName ? "" : (haveName ? " (Condition required)" : haveLogic ? " (Name required)" : "Name and Condition required")

        clonedEdge.animated = !haveLogic;
        clonedEdge.label = `${label || ''}${error}`;

        updateEdge(clonedEdge);
    }

    const setNodeValue = (nodeId: string, key: string, value: string) => {
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.decisions.${nodeId}.${key}`, value);
        set(clonedNode, `data.decisions.${nodeId}.type`, 'normal');
        updateNode(clonedNode);
        updateDecisionEdge(clonedNode, nodeId);
    }

    const outgoners = useMemo(() => getOutgoers(node, nodes, edges).map(x => ({
        oNode: x,
        oNodeDetails: getNodeDetails(x.type)
    })), [node, nodes, edges])

    const alreadyHaveElse = useMemo(() => outgoners.some(({ oNode }) => get(node, `data.decisions.${oNode.id}.type`) == 'else'), [node, outgoners])

    const markAsElse = (nodeId: string) => {
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.decisions.${nodeId}.type`, 'else');
        set(clonedNode, `data.decisions.${nodeId}.name`, 'Else');
        set(clonedNode, `data.decisions.${nodeId}.condition`, 'else');
        updateNode(clonedNode);
        updateDecisionEdge(clonedNode, nodeId);
    }

    const clearElse = (nodeId: string) => {
        const clonedNode = cloneDeep(node);
        set(clonedNode, `data.decisions.${nodeId}`, {});
        updateNode(clonedNode);
        updateDecisionEdge(clonedNode, nodeId);
    }

    const onChangeConditionEditorPopup = (condition: string) => {
        if (!conditionEditorNode) return
        setNodeValue(conditionEditorNode.nodeId, 'condition', condition)
        setConditionEditorNode(undefined)
    }

    return (
        <div className='flex flex-col gap-2 px-2'>
            <div className='flex flex-col gap-1'>
                <Label>Name</Label>
                <Input
                    name="name"
                    value={node.data.name as string}
                    placeholder={Metadata.name}
                    onChange={(e) => setValue('name', e.target.value)}
                />
            </div>
            <Label>Decisions</Label>
            {outgoners.length === 0 ? (
                <div className="text-sm text-gray-500">No connections to Decisions block.</div>
            ) : (
                outgoners.map(({ oNode, oNodeDetails }, index) => (
                    <Card key={index} className="flex flex-col pb-2 p-3 border-b border-gray-200">
                        <span className='text-sm font-semibold'>{oNode.data.name ? `${oNode.data.name} (${oNodeDetails.name})` : `${oNodeDetails.name} (${oNode.id})`}</span>

                        {get(node, `data.decisions.${oNode.id}.type`) == 'else' ?
                            (<div className='mt-2'>
                                <Button className='w-full' onClick={() => clearElse(oNode.id)}>Unset else condition</Button>
                            </div>)
                            :
                            (<>
                                <div className="flex flex-col mb-1 gap-2 mt-2">
                                    <Label className='text-sm'>Name</Label>
                                    <Input
                                        name="name"
                                        disabled={get(node, `data.decisions.${oNode.id}.type`) == 'else'}
                                        value={get(node, `data.decisions.${oNode.id}.name`, '')}
                                        onChange={(e) => setNodeValue(oNode.id, 'name', e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col mb-1 gap-2">
                                    <Label className='text-sm'>Condition</Label>
                                    <div className='flex gap-2'>
                                        <Input
                                            name="condition"
                                            readOnly
                                            disabled={get(node, `data.decisions.${oNode.id}.type`) == 'else'}
                                            value={get(node, `data.decisions.${oNode.id}.condition`, '')}
                                        />
                                        <Button size={'icon'} onClick={() => setConditionEditorNode({
                                            nodeId: oNode.id,
                                            condition: get(node, `data.decisions.${oNode.id}.condition`, '')
                                        })}>
                                            <PenBox size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </>)}
                        {!alreadyHaveElse && (!get(node, `data.decisions.${oNode.id}.name`) && !get(node, `data.decisions.${oNode.id}.condition`)) ? <Button className='mt-2' variant={'ghost'} onClick={() => markAsElse(oNode.id)}>Set else condition</Button> : null}
                    </Card>
                ))
            )}
            <ConditionEditorPopup open={!!conditionEditorNode} value={conditionEditorNode?.condition} baseNode={node} onChange={(condition) => onChangeConditionEditorPopup(condition)} onClose={() => setConditionEditorNode(undefined)} />
        </div>
    )
}

const noteStateVariants = cva(
    "bg-white border-2 text-blue-600 border-blue-600 bg-opacity-80 p-2 flex flex-col gap-2 items-center", //tw
    {
        variants: {
            state: {
                idle: '',
                faded: 'opacity-20', //tw
                waiting: 'opacity-20',
                running: 'opacity-40',
                completed: 'opacity-100',
                failed: 'opacity-20 outline outline-red-500', //tw
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
                <NoteIcon state={state} idleIcon={CircleHelp} />
                <span className='text-sm font-semibold'>{name}</span>
            </div>
            <DevMode data={data} />
            <ThreadSourceHandle active={isConnectable} type='multi' />
        </div>
    );
}
