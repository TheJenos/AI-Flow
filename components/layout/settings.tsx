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
import { Bolt} from "lucide-react";
import { DevMode, useSettingStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { Switch } from "../ui/switch";
import { useState } from "react";

const devModeInputs = {
    testOpenAPI: "Use Test OpenAI API",
    showTreads: "Show Tread Names",
    showPropData: "Show Prop Data"
}

export default function Settings() {
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

    return (
        <Card className="absolute top-2 right-2 p-1 flex gap-2 z-50">
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