import { Card } from "../ui/card";

export default function Logo() {
  return (
    <Card className="absolute top-2 left-2 bg-red-500 text-white p-3 z-50">
      <div className="flex relative">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl leading-9">
          AI Flow
        </h1>
        <span className="text-xs font-light text-gray-200 absolute top-0 right-0 -mt-1">
          v1.0.0
        </span>
      </div>
    </Card>
  );
}