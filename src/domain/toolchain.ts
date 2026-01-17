export type ToolchainCandidate = {
    source: string;
    paths: {
        nm_path: string;
        objdump_path: string;
        strings_path: string;
    };
};

export const deriveRootFromNm = (nmPath: string) => {
    const normalized = nmPath.replace(/\\/g, "/");
    const parts = normalized.split("/");
    if (parts.length < 3) return "";
    if (parts[parts.length - 1].startsWith("arm-none-eabi-nm")) {
        const rootParts = parts.slice(0, -2);
        const root = rootParts.join("/");
        return nmPath.includes("\\") ? root.replace(/\//g, "\\") : root;
    }
    return "";
};
