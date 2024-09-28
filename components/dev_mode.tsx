import { NodeData, useSettingStore } from "@/lib/store";

export default function DevMode({data }:{data:NodeData}) {
    const isDevMode = useSettingStore(state => state.isDevMode)

    if(!isDevMode) return null;

    return (
        <div className='text-xs font-semibold whitespace-pre'>
            {data.thread}
            {/* {JSON.stringify(data, null , 2)} */}
        </div>
    )
}