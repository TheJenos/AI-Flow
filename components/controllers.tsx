import { Card } from "./ui/card";
import { Toggle } from "./ui/toggle";
import { useState } from "react";
import { useOnSelectionChange } from "@xyflow/react";
import { Hand, Play, Plus } from "lucide-react";

export default function Controllers() {

  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
 
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodes(nodes.map((node) => node.id));
    },
  }); 

  return (
    <Card className="absolute top-2 left-1/2 -translate-x-1/2 p-1 flex gap-1 z-50">
      {JSON.stringify(selectedNodes)}
      <Toggle>
        <Plus size={20}/>
      </Toggle>
      <Toggle>
        <Hand size={20} />
      </Toggle>
      <Toggle>
        <Play size={20} />
      </Toggle>
    </Card>
  );
}