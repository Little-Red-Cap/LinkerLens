import type { Language } from "./i18n";

export type UiKey =
    | "subtitle"
    | "navDashboard"
    | "navSymbols"
    | "navObjects"
    | "navFindings"
    | "navSettings"
    | "pageDashboard"
    | "pageSymbols"
    | "pageObjects"
    | "pageFindings"
    | "pageSettings"
    | "toolchainReady"
    | "toolchainMissing"
    | "newAnalysis"
    | "analysisHint"
    | "autoDetectEnabled"
    | "manualToolchain"
    | "language"
    | "theme"
    | "themeLight"
    | "themeDark"
    | "settingsToolchainTitle"
    | "settingsToolchainHint"
    | "settingsAutoDetect"
    | "settingsLastDetected"
    | "settingsToolchainRoot"
    | "settingsNmPath"
    | "settingsObjdumpPath"
    | "settingsStringsPath"
    | "settingsBrowse"
    | "settingsReset"
    | "settingsUiTitle"
    | "settingsUiHint"
    | "dashFlashUsed"
    | "dashRamUsed"
    | "dashBss"
    | "dashData"
    | "dashAwaiting"
    | "dashNoData"
    | "dashSectionFootprintTitle"
    | "dashSectionFootprintHint"
    | "dashTopSymbolsTitle"
    | "dashTopSymbolsHint"
    | "dashTopSymbolsEmpty"
    | "symbolsSearchPlaceholder"
    | "symbolsSectionPlaceholder"
    | "symbolsTypePlaceholder"
    | "symbolsApplyFilters"
    | "symbolsExport"
    | "symbolsTableTitle"
    | "symbolsTableHint"
    | "symbolsColumnSymbol"
    | "symbolsColumnSize"
    | "symbolsColumnType"
    | "symbolsColumnSection"
    | "objectsMapTitle"
    | "objectsMapHint"
    | "objectsMapEmpty"
    | "objectsTopTitle"
    | "objectsTopHint"
    | "objectsZeroSymbols"
    | "findingsStatusNotRun"
    | "findingsRuleSizeTitle"
    | "findingsRuleSizeDetail"
    | "findingsRuleRamTitle"
    | "findingsRuleRamDetail"
    | "findingsRuleFloatTitle"
    | "findingsRuleFloatDetail"
    | "findingsRuleExidxTitle"
    | "findingsRuleExidxDetail"
    | "findingsRuleStringsTitle"
    | "findingsRuleStringsDetail";

const zh: Record<UiKey, string> = {
    subtitle: "固件洞察控制台",
    navDashboard: "仪表盘",
    navSymbols: "符号",
    navObjects: "对象与映射",
    navFindings: "问题扫描",
    navSettings: "设置",
    pageDashboard: "仪表盘",
    pageSymbols: "符号分析",
    pageObjects: "对象与映射",
    pageFindings: "问题扫描",
    pageSettings: "设置",
    toolchainReady: "工具链已就绪",
    toolchainMissing: "工具链未配置",
    newAnalysis: "新建分析",
    analysisHint: "选择 ELF 和 MAP 后即可开始分析。",
    autoDetectEnabled: "自动探测已开启",
    manualToolchain: "手动配置工具链",
    language: "语言",
    theme: "主题",
    themeLight: "浅色",
    themeDark: "深色",
    settingsToolchainTitle: "工具链",
    settingsToolchainHint: "配置 arm-none-eabi 工具链路径，自动探测会使用 PATH 和常见安装目录。",
    settingsAutoDetect: "自动探测",
    settingsLastDetected: "上次探测",
    settingsToolchainRoot: "工具链根目录",
    settingsNmPath: "arm-none-eabi-nm",
    settingsObjdumpPath: "arm-none-eabi-objdump",
    settingsStringsPath: "arm-none-eabi-strings",
    settingsBrowse: "浏览",
    settingsReset: "重置",
    settingsUiTitle: "界面偏好",
    settingsUiHint: "默认语言为中文，可随时切换主题与语言。",
    dashFlashUsed: "Flash 已用",
    dashRamUsed: "RAM 已用",
    dashBss: "BSS",
    dashData: "Data",
    dashAwaiting: "等待分析",
    dashNoData: "暂无数据",
    dashSectionFootprintTitle: "段占用概览",
    dashSectionFootprintHint: "分析完成后显示 Flash/RAM 段占用。",
    dashTopSymbolsTitle: "Top 符号",
    dashTopSymbolsHint: "按体积排序的最大函数或对象。",
    dashTopSymbolsEmpty: "运行分析后填充符号列表。",
    symbolsSearchPlaceholder: "搜索符号名或正则",
    symbolsSectionPlaceholder: "段",
    symbolsTypePlaceholder: "类型",
    symbolsApplyFilters: "应用筛选",
    symbolsExport: "导出",
    symbolsTableTitle: "符号表",
    symbolsTableHint: "大 ELF 将使用分页与虚拟滚动保障性能。",
    symbolsColumnSymbol: "符号",
    symbolsColumnSize: "大小",
    symbolsColumnType: "类型",
    symbolsColumnSection: "段",
    objectsMapTitle: "贡献树图",
    objectsMapHint: "Treemap 展示库、对象文件与段的层级关系。",
    objectsMapEmpty: "MAP 解析后显示 Treemap。",
    objectsTopTitle: "主要贡献者",
    objectsTopHint: "定位最占空间的库与对象文件。",
    objectsZeroSymbols: "0 个符号",
    findingsStatusNotRun: "未运行",
    findingsRuleSizeTitle: "固件体积过大",
    findingsRuleSizeDetail: "统计 .text + .rodata + .data",
    findingsRuleRamTitle: "RAM 压力",
    findingsRuleRamDetail: "关注 .bss + .data",
    findingsRuleFloatTitle: "浮点库膨胀",
    findingsRuleFloatDetail: "检测 float 相关符号",
    findingsRuleExidxTitle: "C++ 异常表",
    findingsRuleExidxDetail: "扫描 .ARM.exidx / .ARM.extab",
    findingsRuleStringsTitle: "字符串密度",
    findingsRuleStringsDetail: "统计字符串段与数量",
};

const en: Record<UiKey, string> = {
    subtitle: "Firmware Insight Console",
    navDashboard: "Dashboard",
    navSymbols: "Symbols",
    navObjects: "Objects & Map",
    navFindings: "Findings",
    navSettings: "Settings",
    pageDashboard: "Dashboard",
    pageSymbols: "Symbols",
    pageObjects: "Objects & Map",
    pageFindings: "Findings",
    pageSettings: "Settings",
    toolchainReady: "Toolchain Ready",
    toolchainMissing: "Toolchain Missing",
    newAnalysis: "New Analysis",
    analysisHint: "Select an ELF and MAP file to start analysis.",
    autoDetectEnabled: "Auto-detect enabled",
    manualToolchain: "Manual toolchain",
    language: "Language",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    settingsToolchainTitle: "Toolchain",
    settingsToolchainHint: "Configure arm-none-eabi paths. Auto-detect uses PATH and common installs.",
    settingsAutoDetect: "Auto-detect",
    settingsLastDetected: "Last detected",
    settingsToolchainRoot: "Toolchain root",
    settingsNmPath: "arm-none-eabi-nm",
    settingsObjdumpPath: "arm-none-eabi-objdump",
    settingsStringsPath: "arm-none-eabi-strings",
    settingsBrowse: "Browse",
    settingsReset: "Reset",
    settingsUiTitle: "UI Preferences",
    settingsUiHint: "Default language is Chinese. Switch theme or language anytime.",
    dashFlashUsed: "Flash Used",
    dashRamUsed: "RAM Used",
    dashBss: "BSS",
    dashData: "Data",
    dashAwaiting: "Awaiting analysis",
    dashNoData: "No data",
    dashSectionFootprintTitle: "Section Footprint",
    dashSectionFootprintHint: "Flash and RAM sections appear after analysis.",
    dashTopSymbolsTitle: "Top Symbols",
    dashTopSymbolsHint: "Largest functions and objects by size.",
    dashTopSymbolsEmpty: "Run analysis to populate symbols.",
    symbolsSearchPlaceholder: "Search symbol name or regex",
    symbolsSectionPlaceholder: "Section",
    symbolsTypePlaceholder: "Type",
    symbolsApplyFilters: "Apply Filters",
    symbolsExport: "Export",
    symbolsTableTitle: "Symbols Table",
    symbolsTableHint: "Pagination and virtual scrolling keep large ELF files fast.",
    symbolsColumnSymbol: "Symbol",
    symbolsColumnSize: "Size",
    symbolsColumnType: "Type",
    symbolsColumnSection: "Section",
    objectsMapTitle: "Contribution Map",
    objectsMapHint: "Treemap view of libraries, object files, and sections.",
    objectsMapEmpty: "Treemap will appear after MAP parsing.",
    objectsTopTitle: "Top Contributors",
    objectsTopHint: "Drill into objects to find heavy hitters.",
    objectsZeroSymbols: "0 symbols",
    findingsStatusNotRun: "Not run",
    findingsRuleSizeTitle: "Firmware too large",
    findingsRuleSizeDetail: "Checks .text + .rodata + .data",
    findingsRuleRamTitle: "RAM pressure",
    findingsRuleRamDetail: "Flags .bss + .data usage",
    findingsRuleFloatTitle: "Floating-point bloat",
    findingsRuleFloatDetail: "Detects float-heavy symbols",
    findingsRuleExidxTitle: "C++ exception tables",
    findingsRuleExidxDetail: "Looks for .ARM.exidx / .ARM.extab",
    findingsRuleStringsTitle: "String density",
    findingsRuleStringsDetail: "Counts string sections",
};

const dictionaries: Record<Language, Record<UiKey, string>> = { zh, en };

export function uiText(language: Language, key: UiKey): string {
    return dictionaries[language]?.[key] ?? zh[key] ?? key;
}
