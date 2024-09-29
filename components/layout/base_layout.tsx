import { useFlowStore } from "@/lib/store";
import { useEffect, useRef } from "react";
import { ImperativePanelHandle } from "react-resizable-panels";
import { ReactFlowProvider } from "@xyflow/react";
import { ResizableHandle } from "../ui/resizable";
import { ResizablePanel, ResizablePanelGroup } from "../ui/resizable";
import Topbar from "./topbar";
import Properties from "../node_utils/properties";

export default function BaseLayout({ children }: { children: React.ReactNode }) {
    const isOnlyOneSelected = useFlowStore((state) => state.isOnlyOneSelected);
    const sidebarRef = useRef<ImperativePanelHandle>(null);

    useEffect(() => {
        if (!sidebarRef.current) return;
        const sidebar = sidebarRef.current;
        if (isOnlyOneSelected && sidebar.isCollapsed()) {
            sidebar.expand();
        } else {
            sidebar.collapse();
        }
    }, [isOnlyOneSelected]);

    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={75} className="relative h-screen">
                <ReactFlowProvider>
                    <Topbar />
                    {children}
                </ReactFlowProvider>
            </ResizablePanel>
            <ResizableHandle withHandle={isOnlyOneSelected} />
            <ResizablePanel ref={sidebarRef} collapsible maxSize={30} defaultSize={0} minSize={25}>
                <Properties />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}