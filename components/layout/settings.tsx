import { Card } from "../ui/card";
import { Toggle } from "../ui/toggle";
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
import { Bolt, DollarSign, MoveDown, MoveUp, Timer } from "lucide-react";
import { DevMode, useRuntimeStore, useSettingStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { Switch } from "../ui/switch";
import { useEffect, useMemo, useState } from "react";

const devModeInputs = {
    testOpenAPI: "Use Test OpenAI API",
    showTreads: "Show Tread Names",
    showPropData: "Show Prop Data"
}

export default function Settings() {
    const [duration, setDuration] = useState<string>("00:00.000")
    const { openAIKey, setOpenAIKey, devMode, setDevMode } = useSettingStore(useShallow(state => ({
        openAIKey: state.openAIKey,
        setOpenAIKey: state.setOpenAIKey,
        devMode: state.devMode,
        setDevMode: state.setDevMode
    })))

    const [isDevMode, toggleDevMode] = useState<boolean>(!!devMode)

    const { startTime, endTime, inToken, outToken, amount } = useRuntimeStore(useShallow((state) => ({
        startTime: state.startTime,
        endTime: state.endTime,
        inToken: state.inToken,
        outToken: state.outToken,
        amount: state.amount,
    })))

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        setOpenAIKey(formData.get('apiKey') as string);

        const payload = Object.keys(devModeInputs).map(x => [x, !!formData.get(x)])
        const anyTrue = isDevMode && payload.some(x => x[1])

        setDevMode(anyTrue ? Object.fromEntries(payload) : undefined);
        toggleDevMode(anyTrue)
    }

    const conveterDuration = (start?: number, end?: number) => {
        if (!start) return `00:00.000`
        const duration = (end ?? Date.now()) - start;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        const milliseconds = Math.floor(duration % 1000);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
    }

    useEffect(() => {
        if (!startTime || endTime) {
            setDuration(conveterDuration(startTime, endTime))
            return
        }

        const interval = setInterval(() => setDuration(conveterDuration(startTime)), 10);
        return () => clearInterval(interval);
    }, [startTime, endTime]);

    return (
        <Card className="absolute top-2 right-2 p-1 flex gap-1 z-50">
            <div className="flex gap-2 items-center text-xs mr-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1"><MoveUp size={16}/>{inToken}</div>
                    <div className="flex items-center gap-1"><MoveDown size={16}/>{outToken}</ div>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1"><DollarSign size={16}/>{amount}</div>
                    <div className="flex items-center gap-1"><Timer size={16}/>{duration}</div>
                </div>
            </div>
            <Dialog>
                <DialogTrigger>
                    <Toggle>
                        <Bolt size={20} />
                    </Toggle>
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
                            {isDevMode ? <>
                                {Object.entries(devModeInputs).map(([key,value])=> (
                                    <>
                                        <Label htmlFor={key} className="text-right col-span-3 col-start-2">
                                            {value}
                                        </Label>
                                        <Switch
                                            id={key}
                                            name={key}
                                            className="col-span-3"
                                            defaultChecked={devMode && devMode[key as keyof DevMode]}
                                        />
                                    </>
                                ))}
                            </> : null}
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