import { Maximize2 } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import Markdown from "react-markdown";
import { useEffect } from "react";
import mixpanel from "mixpanel-browser";

export default function MarkdownViewer({text}: {text: string}) {

    useEffect(() => {
        mixpanel.track('markdown_viewer_opened')
    }, [])    

    return (
        <div className='rounded-md relative'>
            <div className="bg-accent p-2 text-xs rounded-md whitespace-pre-wrap max-h-28 overflow-y-auto border border-gray-300">
                {text}
            </div>
            <div className="absolute top-1 right-1">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button toolTip="Markdown Viewer" variant="ghost" className="h-6 w-6" size="icon">
                            <Maximize2 size={10} />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-screen-xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                <h2 className="text-lg font-medium">Markdown Viewer</h2>
                            </DialogTitle>
                            <DialogDescription>
                                <p className="text-sm text-gray-500">View the generated output in Markdown format for better readability and formatting options.</p>
                            </DialogDescription>
                        </DialogHeader>
                        <Markdown className="border border-gray-500 p-3 !h-[600px] !mx-h-[60vh] overflow-y-scroll rounded-md RichEditor-root">{text}</Markdown>
                        <DialogFooter>
                            <Button onClick={() => navigator.clipboard.writeText(text)}>Copy</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}