import { Card } from "../ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Bolt, SquareArrowDownIcon, SquareArrowOutUpRight} from "lucide-react";
import { DevMode, useFlowStore, useSettingStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { Switch } from "../ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const devModeInputs = {
    testOpenAPI: "Use Test OpenAI API",
    showTreads: "Show Tread Names",
    showPropData: "Show Prop Data"
}

export default function Settings() {
    const { toast } = useToast()
    const { openAIKey, setOpenAIKey, devMode, setDevMode } = useSettingStore(useShallow(state => ({
        openAIKey: state.openAIKey,
        setOpenAIKey: state.setOpenAIKey,
        devMode: state.devMode,
        setDevMode: state.setDevMode
    })))

    const [isDevMode, toggleDevMode] = useState<boolean>(!!devMode)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        setOpenAIKey(formData.get('apiKey') as string);

        const payload = Object.keys(devModeInputs).map(x => [x, !!formData.get(x)])
        const anyTrue = isDevMode && payload.some(x => x[1])

        setDevMode(anyTrue ? Object.fromEntries(payload) : undefined);
        toggleDevMode(anyTrue)
    }

    const onImport = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                const text = await file.text();
                try {
                    const payload = JSON.parse(text);
                    const { setNodes, setEdges } = useFlowStore.getState();
                    setNodes(payload.nodes)
                    setEdges(payload.edges)
                    window.location.reload();
                } catch (error) {
                    toast({
                        title: `Something went wrong`,
                        description: (error as Error).message,
                        duration: 3000
                    })
                }
                fileInput.remove();
            }
        };
        fileInput.click();
    }

    const onExport = () => {
        const { nodes, edges } = useFlowStore.getState();
        const data = JSON.stringify({ nodes, edges }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flow_data.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <Card className="absolute top-2 right-2 p-1 flex gap-2 z-50">
            <Button toolTip="Import" size="icon" variant="ghost" onClick={onImport}>
                <SquareArrowDownIcon size={20} />
            </Button>
            <Button toolTip="Export" size="icon" variant="ghost" onClick={onExport}>
                <SquareArrowOutUpRight size={20} />
            </Button>
            <Dialog>
                <DialogTrigger>
                    <Button toolTip="Settings" size="icon" variant="ghost">
                        <Bolt size={20} />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Settings</DialogTitle>
                        <DialogDescription>
                            Global settings (None of these will be saved on servers)
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-8 items-center gap-4 my-2">
                            <Label htmlFor="apiKey" className="text-right col-span-3">
                                OpenAI API Key
                            </Label>
                            <Input
                                id="apiKey"
                                name="apiKey" // Added name attribute
                                className="col-span-5"
                                defaultValue={openAIKey}
                            />
                            <Label htmlFor="devMode" className="text-right col-span-3">
                                Developer Mode
                            </Label>
                            <Switch
                                id="devMode"
                                name="devMode"
                                className="col-span-5"
                                defaultChecked={isDevMode}
                                onClick={() => toggleDevMode(s => !s)}
                            />
                            {isDevMode ? <div className="col-start-3 col-span-6 flex flex-col gap-2">
                                {Object.entries(devModeInputs).map(([key,value])=> (
                                    <div className="flex gap-4 items-center" key={key}>
                                        <Label htmlFor={key} className="text-right col-span-3 col-start-2">
                                            {value}
                                        </Label>
                                        <Switch
                                            id={key}
                                            name={key}
                                            className="col-span-3"
                                            defaultChecked={devMode && devMode[key as keyof DevMode]}
                                        />
                                    </div>
                                ))}
                            </div> : null}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="submit">Save changes</Button>
                            </DialogClose>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}