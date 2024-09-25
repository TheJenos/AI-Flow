import { getNodeDetails } from "@/lib/nodes";
import useFlowStore from "@/lib/store"
import { useMemo } from "react";

export default function Properties() {
    const selectedNode = useFlowStore((state) => state.selectedNode);

    const nodeDetails = useMemo(() => {
        return selectedNode ? getNodeDetails(selectedNode.type as string) : null;
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
        <div className="flex flex-col gap-2">
            <div className="border-b border-gray-200 p-2">
                <h2 className="text-lg font-bold">{nodeDetails?.name}</h2>
                <p className="text-sm text-gray-500">{nodeDetails?.description}</p>
            </div>
            {PropertiesComponent && <PropertiesComponent node={selectedNode} />}
        </div>
    )
}