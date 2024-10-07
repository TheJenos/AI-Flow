import { NodeData, useSettingStore } from "@/lib/store";

export default function DevMode({data }:{data:NodeData}) {
    const isDevMode = useSettingStore(state => state.devMode)

    if(!isDevMode?.showTreads) return null;

    return (
        <div className='text-xs font-semibold whitespace-pre'>
            {data.thread}
        </div>
    )
}