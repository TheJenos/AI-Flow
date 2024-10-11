import { useToast } from "@/hooks/use-toast";
import { AppNode, useFlowStore, useTemporalFlowStore } from "@/lib/store";
import { Edge, useReactFlow } from "@xyflow/react";
import { PropsWithChildren, useCallback, useEffect } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuShortcut, ContextMenuTrigger } from "../ui/context-menu";

type ClipboardData = {
    node: AppNode[],
    edge: Edge[]
}

export default function FlowContextMenu({ children }: PropsWithChildren) {
    const { toast } = useToast();
    const { screenToFlowPosition } = useReactFlow()
    const selectedNodeFromStore = useFlowStore((state) => state.selectedNode)
    const { undo, redo, futureStates, pastStates } = useTemporalFlowStore((state) => state);

    const cut = useCallback(() => {
        const { nodes, edges, setEdges, setNodes } = useFlowStore.getState()

        const selectedNode = nodes.filter(x => x.selected && x.id != 'start')
        const selectedEdge = edges.filter(x => x.selected && x.source != 'start' && x.target != 'start')
        const selectedNodeIds = selectedNode.map(x => x.id)

        setNodes(nodes.filter(x => !x.selected || x.id == 'start'))
        setEdges(edges.filter(x => !selectedNodeIds.includes(x.source) && !selectedNodeIds.includes(x.target)))

        navigator.clipboard.writeText(JSON.stringify({
            node: selectedNode,
            edge: selectedEdge
        } as ClipboardData));
    }, [])

    const copy = useCallback(() => {
        const { nodes, edges } = useFlowStore.getState()

        const selectedNode = nodes.filter(x => x.selected && x.id != 'start')
        const selectedEdge = edges.filter(x => x.selected && x.source != 'start' && x.target != 'start')

        navigator.clipboard.writeText(JSON.stringify({
            node: selectedNode,
            edge: selectedEdge
        } as ClipboardData));
    }, [])

    const past = useCallback(async () => {
        try {
            const { nodes, edges, setEdges, setNodes } = useFlowStore.getState()

            const permission = await navigator.permissions.query({ name: 'clipboard-read' } as unknown as PermissionDescriptor);
            if (permission.state === 'denied') {
                throw new Error('Not allowed to read clipboard.');
            }

            const clipboardData = JSON.parse(await navigator.clipboard.readText()) as ClipboardData

            const reactFlowDiv = document.querySelector(".react-flow")
            if (!reactFlowDiv) return
            const center = screenToFlowPosition({ x: reactFlowDiv.clientWidth / 2, y: reactFlowDiv.clientHeight / 2 })

            const filteredNodes = clipboardData.node.filter(x => x.id != 'start')
            const filteredEdges = clipboardData.edge.filter(x => x.source != 'start' && x.target != 'start')

            const centerX = filteredNodes.reduce((c, x) => c + x.position.x, 0) / filteredNodes.length;
            const centerY = filteredNodes.reduce((c, x) => c + x.position.y, 0) / filteredNodes.length;

            const threadPostfix = Math.random().toString(16).slice(2).substring(0, 3)

            const nodesWithNewIds = Object.fromEntries(filteredNodes.map(x => [x.id, {
                ...x,
                id: `${x.type}_${Math.random().toString(16).slice(2)}`,
                position: {
                    x: x.position.x - centerX + center.x,
                    y: x.position.y - centerY + center.y
                }
            }]))

            for (const key in nodesWithNewIds) {
                const currentNode = nodesWithNewIds[key]
                currentNode.data.state = 'idle'
                currentNode.data.parentId = nodesWithNewIds[currentNode.data.parentId || '']?.id
                currentNode.data.thread += `_${threadPostfix}`
                nodesWithNewIds[key] = currentNode
            }

            const edgesWithNewIds = filteredEdges.map(x => ({
                ...x,
                id: `edge_${Math.random().toString(16).slice(2)}`,
                source: nodesWithNewIds[x.source]?.id,
                target: nodesWithNewIds[x.target]?.id
            } as Edge))

            setNodes([
                ...nodes.map(x => ({ ...x, selected: false })),
                ...(Object.values(nodesWithNewIds))
            ])

            setEdges([
                ...edges.map(x => ({ ...x, selected: false })),
                ...edgesWithNewIds
            ])

        } catch (error) {
            toast({
                title: `Something went wrong`,
                description: (error as Error).message,
                duration: 3000
            })
        }
    }, [screenToFlowPosition, toast])


    useEffect(() => {
        function keyPressHandler(e: KeyboardEvent) {
            const element = e.target as HTMLElement
            if (element.tagName == "INPUT" || element.tagName == "TEXTAREA") return
            if (element.classList.contains('public-DraftEditor-content')) return
            e.preventDefault()

            if ((e.ctrlKey || e.metaKey) && e.key == 'x') {
                cut()
            }

            if ((e.ctrlKey || e.metaKey) && e.key == 'c') {
                copy()
            }

            if ((e.ctrlKey || e.metaKey) && e.key == 'v') {
                past()
            }
        }

        window.addEventListener('keydown', keyPressHandler);

        return () => window.removeEventListener('keydown', keyPressHandler)
    }, [copy, cut, past])

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem disabled={pastStates.length == 0} onClick={() => undo()}>
                    Undo
                    <ContextMenuShortcut>⌘ + Z</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem disabled={futureStates.length == 0} onClick={() => redo()}>
                    Redo
                    <ContextMenuShortcut>⌘ + Y</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem disabled={!selectedNodeFromStore} onClick={cut}>
                    Cut
                    <ContextMenuShortcut>⌘ + X</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem disabled={!selectedNodeFromStore} onClick={copy}>
                    Copy
                    <ContextMenuShortcut>⌘ + C</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={past}>
                    Pasts
                    <ContextMenuShortcut>⌘ + V</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}