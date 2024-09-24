import { Card } from "./ui/card";
import { Toggle } from "./ui/toggle";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Bolt } from "lucide-react";

export default function Settings() {
    return <Card className="absolute top-2 right-2 p-1 flex gap-1 z-50">
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
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="apiKey" className="text-right">
                            OpenAI API Key
                        </Label>
                        <Input
                            id="apiKey"
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </Card>
}