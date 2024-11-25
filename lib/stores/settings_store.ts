import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createJSONStorage } from "zustand/middleware";

export type DevMode = {
    testOpenAPI: boolean;
    showTreads: boolean;
    showPropData: boolean;
}

export type SettingsState = {
    openAIKey: string;
    devMode?: DevMode;
    setOpenAIKey: (key: string) => void;
    setDevMode: (value?: DevMode) => void;
};

export const useSettingStore = create<SettingsState>()(persist(set => ({
    openAIKey: '',
    devMode: undefined,
    setOpenAIKey: key => set({ openAIKey: key }),
    setDevMode: value => set({ devMode: value }),
}), {
    name: 'flow-setting-store',
    storage: createJSONStorage(() => localStorage)
}));