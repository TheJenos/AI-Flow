import { ChangeEvent, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { PenBox, Route } from "lucide-react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTrigger } from "./dialog"
import { DialogTitle } from "@radix-ui/react-dialog"
import { Button } from "./button"
import RichTextEditor from "./rich_text_editor"
import { AppNode } from "@/lib/store"
import { HighlightWithinTextarea } from 'react-highlight-within-textarea'
import { headlights } from "@/lib/logics"
import DynamicEditorPopup from "../node_utils/dynamic_editor_popup"
import JsonEditor from "./json_editor"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  node?: AppNode
  type?: 'text' | 'json'
  schema?: object
  withoutHighlights?: boolean
  withoutRichText?: boolean
  classNameFrame?: string
}

export function Textarea({ className, classNameFrame, withoutRichText, type = 'text', schema, withoutHighlights, node, value, onChange }: TextareaProps) {
  const [openValueSelector, setOpenValueSelector] = useState(false)

  const [key, setKey] = useState(Math.random() * 1000)

  useEffect(() => {
    if (!openValueSelector)
      setKey(Math.random() * 1000)
  }, [openValueSelector])

  return (
    <div className={cn('relative group overflow-hidden rounded-md', classNameFrame)}>
      {/* <textarea
        key={key+10}
        className={cn(
          "flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-20 overflow-y-scroll w-full p-2",
          className
        )}
        ref={ref}
        {...props}
        value={value}
      /> */}
      <div className={cn(
        "flex justify-stretch items-stretch min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-20 overflow-y-scroll w-full p-2",
        "[&>div]:h-full [&_.DraftEditor-root]:flex-1", //tw
        className
      )}>
        <HighlightWithinTextarea highlight={!withoutHighlights && headlights} value={value?.toString() || ''} onChange={(value) => onChange && onChange({ target: { value } } as ChangeEvent<HTMLTextAreaElement>)} />
      </div>
      {node || !withoutRichText ? <div className="absolute -top-12 right-2 flex gap-1 p-1 bg-gray-200 rounded-md transition-all duration-100 group-hover:top-1 z-10">
        {node ? <Button toolTip="Value Selector" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setOpenValueSelector(true)}>
          <Route size={16} />
        </Button> : null}
        {!withoutRichText ? <Dialog>
          <DialogTrigger asChild>
            <Button toolTip={type == 'text' ? "Rich Editor" : "JSON Editor"} variant="ghost" className="h-6 w-6" size="icon">
              <PenBox size={16} />
            </Button>
          </DialogTrigger>

          <DialogContent className={cn('overflow-y-auto', type =='json' ? "max-w-screen-md": "max-w-screen-xl")}>
            {type == 'text' ? <DialogHeader>
              <DialogTitle>
                <h2 className="text-lg font-medium">Rich Text Editor</h2>
              </DialogTitle>
              <DialogDescription>
                <p className="text-sm text-gray-500">Edit the content of the textarea using the rich text editor. also you can copy the content from docx file.</p>
              </DialogDescription>
            </DialogHeader> : <DialogHeader>
              <DialogTitle>
                <h2 className="text-lg font-medium">Json Editor</h2>
              </DialogTitle>
              <DialogDescription>
                <p className="text-sm text-gray-500">Edit the JSON content directly in the editor. Ensure the JSON structure is valid to avoid errors.</p>
              </DialogDescription>
            </DialogHeader>}
            {type == 'text' ?
              <RichTextEditor
                key={key}
                initialContent={value?.toString() || ''}
                onChange={(value) => onChange && onChange({ target: { value } } as ChangeEvent<HTMLTextAreaElement>)}
                withoutHighlights={withoutHighlights}
                extraToolButtons={node && (
                  <Button size="icon" variant="ghost" onClick={() => setOpenValueSelector(true)}>
                    <Route size={16} />
                  </Button>
                )}
              />
              :
              <JsonEditor
                defaultValue={value?.toString() || ''}
                schema={schema}
                onChange={(value) => onChange && onChange({ target: { value } } as ChangeEvent<HTMLTextAreaElement>)}
              />
            }
            <DialogFooter>
              <DialogClose asChild>
                <Button onClick={() =>
                  onChange && onChange({
                    target: {
                      value: value
                    }
                  } as React.ChangeEvent<HTMLTextAreaElement>)
                }>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog> : null}
      </div> : null}
      {node ? (
        <DynamicEditorPopup
          type="value"
          open={openValueSelector}
          baseNode={node}
          onChange={(s) => {
            if (onChange) {
              onChange({ target: { value: (value || '') + s } } as ChangeEvent<HTMLTextAreaElement>);
            }
            setOpenValueSelector(false);
          }}
          onClose={() => setOpenValueSelector(false)}
        />
      ) : null}
    </div>
  )
}
