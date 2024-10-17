import { Network } from "lucide-react";
import { Card } from "../ui/card";

export default function Logo() {
  return (
    <Card className="absolute top-2 left-2 bg-red-500 text-white p-3 z-50 select-none border-0 shadow-lg">
      <div className="flex relative items-center">
        <Network size={32}/>
        <h1 className="ml-2 scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl leading-9">
          LLM Flow
        </h1>
        <span className="text-[12px] font-extrabold text-gray-200 absolute top-0 right-0 -mt-1 tracking-tighter">
          v1.0.0
        </span>
        <a href="https://github.com/TheJenos" className="text-[12px] font-extrabold text-gray-200 absolute bottom-0 right-0 translate-y-1/2 tracking-tighter mt-1">
          from Jenos
        </a>
      </div>
    </Card>
  );
}