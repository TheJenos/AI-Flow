import { getNodeDetails } from "@/lib/nodes";
import { useFlowStore, useSettingStore } from "@/lib/store"
import { useMemo } from "react";

export default function Properties() {
    const selectedNode = useFlowStore((state) => state.selectedNode)
    const isDevMode = useSettingStore(state => state.devMode)

    const nodeDetails = useMemo(() => {
        return selectedNode ? getNodeDetails(selectedNode.type) : null;
    }, [selectedNode]);

    const PropertiesComponent = nodeDetails?.properties;

    if (!selectedNode) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500">No node selected</p>
                <p className="text-sm text-gray-400">Select a node to view its properties</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <div className="border-b border-gray-200 p-3">
                <h2 className="font-bold">{nodeDetails?.name}</h2>
                <p className="text-xs text-gray-500">{nodeDetails?.description}</p>
                <div className="mt-2 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold">Node ID : </span>
                        <p className="text-gray-500">{selectedNode.id}</p>
                    </div>
                    {isDevMode?.showPropData ? <div className="flex flex-col gap-2 text-xs">
                        <span className="font-semibold">Data : </span>
                        <p className="text-gray-500 whitespace-pre">{JSON.stringify(selectedNode.data, null, 4)}</p>
                    </div> : null } 
                </div>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
                {PropertiesComponent && <PropertiesComponent key={selectedNode.id} node={selectedNode} />}
            </div>
        </div>
    )
}