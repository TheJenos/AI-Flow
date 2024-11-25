import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createJSONStorage } from "zustand/middleware";

type Index = {
    indexName: string
}

type DocumentFiles = {
    index: string
    fileName: string
    hash: string
}

export type RagStoreState = {
    indexes: Record<string, Index>;
    files: Record<string, DocumentFiles>;
    addIndex: (index: string) => void
    addFile: (index: string, file: File) => void
};

const readAsText = (file: File) => {
    return new Promise<string>((resolve)=>{
        let fileReader = new FileReader();
        fileReader.onload = function(ev){
            return resolve(fileReader.result as string);
        }
        fileReader.readAsText(file);
    })
} 

export const useRagStore = create<RagStoreState>()(persist((set, get) => ({
    indexes: {},
    files: {},
    addIndex: (index) => set((state) => ({
        indexes: {...state.indexes, [`index_${Math.random().toString(16).slice(2)}`]: {indexName: index}}
    })),
    addFile: async (index, file) => {
        const state = get()
        if (!(index in state.indexes)) {
            throw Error('Index not found')
        }
        const result = await readAsText(file);
        const hash = await crypto.subtle.digest('SHA-256',(new TextEncoder()).encode(result))
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); 
        set((state) => {
            if (hashHex in state.files) {
                throw Error('File is already in the store')
            }

            return {
                files: {...state.files, [hashHex]: {
                    fileName: file.name,
                    hash: hashHex,
                    index
                }}
            }
        })
    },
}), {
    name: 'flow-rag-store',
    storage: createJSONStorage(() => localStorage)
}));