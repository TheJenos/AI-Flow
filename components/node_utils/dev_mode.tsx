import { NodeData } from "@/lib/stores/flow_store";
import { useSettingStore } from "@/lib/stores/settings_store";

export default function DevMode({data }:{data:NodeData}) {
    const isDevMode = useSettingStore(state => state.devMode)

    if(!isDevMode?.showTreads) return null;

    return (
        <div className='text-xs font-semibold whitespace-pre'>
            {data.thread}
            <br/>
            {data.parentId}
        </div>
    )
}