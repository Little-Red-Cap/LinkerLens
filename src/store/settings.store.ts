import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ToolchainSettings = {
    autoDetect: boolean;
    toolchainRoot: string;
    nmPath: string;
    objdumpPath: string;
    stringsPath: string;
    lastDetected: string;
};

type SettingsState = {
    toolchain: ToolchainSettings;
    updateToolchain: (next: Partial<ToolchainSettings>) => void;
    resetToolchain: () => void;
};

const defaultToolchain: ToolchainSettings = {
    autoDetect: true,
    toolchainRoot: "",
    nmPath: "",
    objdumpPath: "",
    stringsPath: "",
    lastDetected: "",
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            toolchain: defaultToolchain,
            updateToolchain: (next) =>
                set((state) => ({
                    toolchain: {
                        ...state.toolchain,
                        ...next,
                    },
                })),
            resetToolchain: () => set({ toolchain: defaultToolchain }),
        }),
        {
            name: "linkerlens-settings-v1",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
