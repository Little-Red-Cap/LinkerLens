import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AnalysisInputs = {
    elfPath: string;
    mapPath: string;
};

type SectionTotals = {
    flashBytes: number;
    ramBytes: number;
    textBytes: number;
    rodataBytes: number;
    dataBytes: number;
    bssBytes: number;
    flashRegionBytes?: number | null;
    ramRegionBytes?: number | null;
};

type SymbolInfo = {
    name: string;
    size: number;
    addr?: string;
    kind: string;
    section_guess?: string;
};

type ObjectContribution = {
    name: string;
    size: number;
};

type TreeNode = {
    name: string;
    size: number;
    children: TreeNode[];
};

type MemoryRegion = {
    name: string;
    origin: string;
    length: number;
    used: number;
};

type AnalysisSummary = {
    sections_totals: SectionTotals;
    top_symbols: SymbolInfo[];
    top_objects: ObjectContribution[];
    top_libraries: ObjectContribution[];
    top_sections: ObjectContribution[];
    map_tree: TreeNode[];
    memory_regions: MemoryRegion[];
};

type AnalysisResult = {
    summary: AnalysisSummary;
};

type AnalysisState = {
    inputs: AnalysisInputs;
    status: "idle" | "running" | "success" | "error";
    lastError: string | null;
    result: AnalysisResult | null;
    setInputs: (next: Partial<AnalysisInputs>) => void;
    setStatus: (status: AnalysisState["status"], error?: string | null) => void;
    setResult: (result: AnalysisResult | null) => void;
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
            status: "idle",
            lastError: null,
            result: null,
            setInputs: (next) =>
                set((state) => ({
                    inputs: {
                        ...state.inputs,
                        ...next,
                    },
                })),
            setStatus: (status, error = null) => set({ status, lastError: error }),
            setResult: (result) => set({ result }),
            resetInputs: () => set({ inputs: defaultInputs }),
        }),
        {
            name: "linkerlens-analysis-inputs-v1",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ inputs: state.inputs }),
        },
    ),
);
