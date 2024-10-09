import { useTemporalFlowStore } from "@/lib/store";
import { useEffect } from "react";
import { Toggle } from "../ui/toggle";
import { Redo, Undo } from "lucide-react";

export default function UndoRedo() {
    const { undo, redo, futureStates, pastStates } = useTemporalFlowStore((state) => state);

    useEffect(() => {
      function keyPressHandler(e: KeyboardEvent) {
        const element = e.target as HTMLElement
        if (element.tagName == "INPUT" || element.tagName == "TEXTAREA") return
        if (element.classList.contains('public-DraftEditor-content')) return
        e.preventDefault()
        
        if ((e.ctrlKey || e.metaKey) && e.key == 'z') {
            undo()
        }

        if ((e.ctrlKey || e.metaKey) && e.key == 'y') {
            redo()
        }
      }
      
      window.addEventListener('keydown', keyPressHandler);

      return () => window.removeEventListener('keydown', keyPressHandler)
    }, [redo, undo])

    return <>
     <Toggle onClick={() => undo()} disabled={pastStates.length == 0} >
        <Undo/>
      </Toggle>
      <Toggle onClick={() => redo()} disabled={futureStates.length == 0} >
        <Redo/>
      </Toggle>
    </>
}