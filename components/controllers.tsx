import NewNode from "./new_node";
import { Card } from "./ui/card";
import { Toggle } from "./ui/toggle";
import { Play } from "lucide-react";

export default function Controllers() {
  return (
    <Card className="absolute top-2 left-1/2 -translate-x-1/2 p-1 flex gap-1 z-50">
      <NewNode />
      <Toggle>
        <Play size={20} />
      </Toggle>
    </Card>
  );
}