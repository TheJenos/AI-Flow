import { useSettingStore } from "@/lib/store";
import { ArrowUpDown, DollarSign, MoveUp, MoveDown, Timer } from "lucide-react";
import { useEffect, useState } from "react";

export type StatsProps = {
    startTime?: number
    endTime?: number,
    inToken: number,
    outToken: number,
    amount: number
}

export function Stats({ startTime, endTime, inToken, outToken, amount }: StatsProps) {
    const [duration, setDuration] = useState<string>("00:00.000")
    const isTestAPI = useSettingStore((state) => state.devMode?.testOpenAPI || false)
    const covetedAmount =  String(amount.toFixed(6)).padStart(7, '0')

    const coveterDuration = (start?: number, end?: number) => {
        if (!start) return `00:00.000`
        const duration = (end ?? Date.now()) - start;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        const milliseconds = Math.floor(duration % 1000);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
    }

    useEffect(() => {
        if (!startTime || endTime) {
            setDuration(coveterDuration(startTime, endTime))
            return
        }

        const interval = setInterval(() => setDuration(coveterDuration(startTime)), 10);
        return () => clearInterval(interval);
    }, [startTime, endTime]);

    return (
        <div className="mt-3">
            {isTestAPI ? <span className="font-bold text-red-600 text-xs">Currently you are using Test API</span> : null}
            <div className="grid sm:grid-cols-3 xl:grid-cols-5 gap-2 text-xs bg-accent p-2 rounded-md flex-wrap border border-gray-300">
                <div className="flex items-center gap-1"><MoveUp size={16} /> {inToken}</div>
                <div className="flex items-center gap-1"><MoveDown size={16} /> {outToken}</ div>
                <div className="flex items-center gap-1"><ArrowUpDown size={16} /> {inToken + outToken}</ div>
                <div className="flex items-center gap-1"><DollarSign size={16} /> {covetedAmount}</div>
                <div className="flex items-center gap-1"><Timer size={16} /> {duration}</div>
            </div>
        </div>
    )
}