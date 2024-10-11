import { forwardRef, useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { PenBox, Route } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTrigger } from "./dialog"
import { DialogTitle } from "@radix-ui/react-dialog"
import { Button } from "./button"
import RichTextEditor from "./rich_text_editor"
import { AppNode } from "@/lib/store"
import ValueSelectorPopup from "../node_utils/value_selector_popup"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  node?: AppNode
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, node, ...props }, ref) => {
    const [value, setValue] = useState(props.value as string)
    const [openValueSelector, setOpenValueSelector] = useState(false)

    const [key, setKey] = useState(Math.random() * 1000)

    useEffect(() => {
      if (!openValueSelector)
      setKey(Math.random() * 1000)
    },[openValueSelector])

    useEffect(() => {
      setValue((props.value || '') as string)
    },[props.value])

    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-20 overflow-y-scroll w-full p-2",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute bottom-1 right-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="h-6 w-6" size="icon">
                <PenBox size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-screen-xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  <h2 className="text-lg font-medium">Rich Text Editor</h2>
                </DialogTitle>
                <DialogDescription>
                  <p className="text-sm text-gray-500">Edit the content of the textarea using the rich text editor. also you can copy the content from docx file.</p>
                </DialogDescription>
              </DialogHeader>
              <RichTextEditor
                key={key}
                initialContent={value}
                onChange={(e) => setValue(e)}
                extraToolButtons={(
                  <Button size="icon" variant="ghost" onClick={() => setOpenValueSelector(true)}>
                    <Route size={16} />
                  </Button>
                )}
              />
              {node ? <ValueSelectorPopup open={openValueSelector} baseNode={node} onSelect={(s) => {
                setValue(x => x + s)
                setOpenValueSelector(false)
              }} onClose={() => setOpenValueSelector(false)} /> : null}
              <DialogFooter>
                <DialogClose asChild>
                  <Button onClick={() =>
                    props.onChange && props.onChange({
                      target: {
                        value: value
                      }
                    } as React.ChangeEvent<HTMLTextAreaElement>)
                  }>Save</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
