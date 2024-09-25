import useFlowStore from "@/lib/store";
import Topbar from "./topbar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { useEffect, useRef } from "react";
import { ImperativePanelHandle } from "react-resizable-panels";
import Properties from "./properties";

export default function BaseLayout({ children }: { children: React.ReactNode }) {
    const isOnlyOneSelected = useFlowStore((state) => state.isOnlyOneSelected);
    const sidebarRef = useRef<ImperativePanelHandle>(null);

    useEffect(() => {
        if (!sidebarRef.current) return;
        const sidebar = sidebarRef.current;
        if (isOnlyOneSelected && sidebar.isCollapsed()) {
            sidebar.expand();
        }else{
            sidebar.collapse();
        }
    }, [isOnlyOneSelected]);

    return (
        <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={75} className="relative h-screen">
                <Topbar />
                {children}
            </ResizablePanel>
            <ResizableHandle withHandle={isOnlyOneSelected} />
            <ResizablePanel ref={sidebarRef} collapsible maxSize={30} defaultSize={0} minSize={25}>
                <Properties/>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}