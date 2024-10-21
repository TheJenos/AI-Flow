import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { AppNode } from "@/lib/store";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { validateStatement } from "@/lib/logics";
import ValueSelector from "./value_selector";
import { Textarea } from "../ui/textarea";
import mixpanel from "mixpanel-browser";

type DynamicEditorPopupProps = {
    baseNode: AppNode,
    open: boolean,
    type: 'condition' | 'value'
    value?: string,
    onChange: (value: string) => void,
    onClose: () => void
}

export default function DynamicEditorPopup({ baseNode, open, type, value, onChange, onClose } : DynamicEditorPopupProps) {
    const [condition, setCondition] = useState<string>(value || '')

    useEffect(() => {
        setCondition(value || '')
    }, [value])

    const isValidCondition = useMemo(() => validateStatement(condition), [condition])

    useEffect(() => {
        if (open) mixpanel.track('dynamic_editor_opened', {type})
    }, [open,type])  

    return (
        <Dialog open={open} onOpenChange={(state) => !state && onClose && onClose()}>
            <DialogContent className="max-w-screen-md">
                {type == 'condition' ? <DialogHeader>
                    <DialogTitle>Condition builder</DialogTitle>
                    <DialogDescription>Build conditions for node transitions</DialogDescription>
                </DialogHeader> : <DialogHeader>
                    <DialogTitle>Value Selector</DialogTitle>
                    <DialogDescription>Select a dynamic value to insert into your template.</DialogDescription>
                </DialogHeader> } 
                <ValueSelector baseNode={baseNode} onSelect={(s) => type == 'value' ? onChange(s) : setCondition(x => `${x}${s}`)} />
                {type == 'condition' ? <DialogFooter className="items-end">
                    <div className="w-full">
                        <Label>Condition <span className={isValidCondition ? 'text-green-600' : 'text-red-600'}>{isValidCondition ? '(Valid)' : '(Invalid)'}</span></Label>
                        <Textarea classNameFrame={cn('mt-2', isValidCondition ? 'outline !outline-green-600' : 'outline !outline-red-600')} value={condition} onChange={(e) => setCondition(e.target.value)} withoutRichText />
                    </div>
                    <DialogClose asChild>
                        <Button disabled={!isValidCondition} onClick={() => isValidCondition ? onChange(condition) : null}>Set Condition</Button>
                    </DialogClose>
                </DialogFooter> : null }
            </DialogContent>
        </Dialog>
    )
}