export type AnalyzeParams = {
    elf_path: string;
    map_path: string | null;
    toolchain: {
        auto_detect: boolean;
        toolchain_root: string | null;
        nm_path: string | null;
        objdump_path: string | null;
        strings_path: string | null;
    };
};
