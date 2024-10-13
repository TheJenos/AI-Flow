import { ReactFlowProvider } from "@xyflow/react";
import { ResizableHandle } from "../ui/resizable";
import { ResizablePanel, ResizablePanelGroup } from "../ui/resizable";
import Topbar from "./topbar";
import Properties from "../node_utils/properties";
import { useFlowStore } from "@/lib/store";
import RuntimeLogs from "../node_utils/runtime_logs";
import { TooltipProvider } from "../ui/tooltip";

export default function BaseLayout({ children }: { children: React.ReactNode }) {

    const selectedNode = useFlowStore((state) => state.selectedNode)

    return (
        <TooltipProvider>
            <ReactFlowProvider>
                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel defaultSize={75} className="relative h-screen">
                        <Topbar />
                        {children}
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel collapsible maxSize={30} defaultSize={30} minSize={25}>
                        {selectedNode ? <Properties /> : <RuntimeLogs />}
                    </ResizablePanel>
                </ResizablePanelGroup>
            </ReactFlowProvider>
        </TooltipProvider>
    );
}