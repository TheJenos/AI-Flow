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
import { useRuntimeStore, useSettingStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { Switch } from "../ui/switch";

export default function Settings() {
    const { openAIKey, setOpenAIKey, isDevMode, setDevMode } = useSettingStore(useShallow(state => ({
        openAIKey: state.openAIKey,
        setOpenAIKey: state.setOpenAIKey,
        isDevMode: state.isDevMode,
        setDevMode: state.setDevMode
    })))

    const { duration, inToken, outToken, amount } = useRuntimeStore(useShallow((state) => ({
        duration: state.duration,
        inToken: state.inToken,
        outToken: state.outToken,
        amount: state.amount,
    })))

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        setOpenAIKey(formData.get('apiKey') as string);
        setDevMode(!!(formData.get('devMode') as string));
    }

    return (
        <Card className="absolute top-2 right-2 p-1 flex gap-1 z-50">
            <div className="flex gap-2 items-center text-xs">
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
                            Global settings (None of these will be saved on the server)
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
                            />
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