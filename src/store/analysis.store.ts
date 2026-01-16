import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AnalysisInputs = {
    elfPath: string;
    mapPath: string;
};

type AnalysisState = {
    inputs: AnalysisInputs;
    setInputs: (next: Partial<AnalysisInputs>) => void;
    resetInputs: () => void;
};

const defaultInputs: AnalysisInputs = {
    elfPath: "",
    mapPath: "",
};

export const useAnalysisStore = create<AnalysisState>()(
    persist(
        (set) => ({
            inputs: defaultInputs,
            setInputs: (next) =>
                set((state) => ({
                    inputs: {
                        ...state.inputs,
                        ...next,
                    },
                })),
            resetInputs: () => set({ inputs: defaultInputs }),
        }),
        {
            name: "linkerlens-analysis-inputs-v1",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
