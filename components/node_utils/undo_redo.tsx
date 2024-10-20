import { useTemporalFlowStore } from "@/lib/store";
import { useEffect } from "react";
import { Toggle } from "../ui/toggle";
import { Redo, Undo } from "lucide-react";

export default function UndoRedo() {
    const { undo, redo, futureStates, pastStates } = useTemporalFlowStore((state) => state);

    useEffect(() => {
      const reactFlowDiv = document.querySelector('.react-flow') as HTMLInputElement
      if (!reactFlowDiv) return

      const keyPressHandler = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key == 'z') {
            undo()
          }

          if ((e.ctrlKey || e.metaKey) && e.key == 'y') {
            redo()
          }
      }

      reactFlowDiv.addEventListener('keydown', keyPressHandler);

      return () => reactFlowDiv.removeEventListener('keydown', keyPressHandler)
  }, [redo, undo])

    return <>
     <Toggle toolTip="Undo" onClick={() => undo()} disabled={pastStates.length == 0} >
        <Undo/>
      </Toggle>
      <Toggle toolTip="Redo" onClick={() => redo()} disabled={futureStates.length == 0} >
        <Redo/>
      </Toggle>
    </>
}