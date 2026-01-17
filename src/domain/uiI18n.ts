import type { Language } from "./i18n";

export type UiKey =
    | "subtitle"
    | "navDashboard"
    | "navSymbols"
    | "navObjects"
    | "navFindings"
    | "navLookup"
    | "navSettings"
    | "pageDashboard"
    | "pageSymbols"
    | "pageObjects"
    | "pageFindings"
    | "pageLookup"
    | "pageSettings"
    | "toolchainReady"
    | "toolchainMissing"
    | "toolchainDetectSuccess"
    | "toolchainDetectFailed"
    | "newAnalysis"
    | "analysisHint"
    | "analysisSelectElfTitle"
    | "analysisSelectMapTitle"
    | "analysisElfLabel"
    | "analysisMapLabel"
    | "analysisNotSet"
    | "analysisNeedToolchain"
    | "analysisMissingElf"
    | "analysisRunCurrent"
    | "analysisStart"
    | "analysisFailed"
    | "analysisStatusTitle"
    | "analysisStatusIdle"
    | "analysisStatusRunning"
    | "analysisStatusSuccess"
    | "analysisStatusError"
    | "analysisStatusNone"
    | "analysisStatusDetail"
    | "analysisSourceMap"
    | "analysisSourceEstimate"
    | "analysisCacheHit"
    | "analysisCacheMiss"
    | "lookupTitle"
    | "lookupHint"
    | "lookupPlaceholder"
    | "lookupNeedAnalysis"
    | "lookupNotFound"
    | "lookupOffset"
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
    | "settingsDetect"
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
    | "dashInputTitle"
    | "dashInputHint"
    | "dashRegionsTitle"
    | "dashRegionsHint"
    | "dashRegionsUsageNote"
    | "dashRegionsBasisLabel"
    | "dashRegionsBasisVma"
    | "dashRegionsBasisLd"
    | "dashRegionsUsageNoteVma"
    | "dashRegionsUsageNoteLd"
    | "dashRegionName"
    | "dashRegionOrigin"
    | "dashRegionLength"
    | "dashRegionUsed"
    | "dashRegionDefaultTag"
    | "dashRegionDefaultHint"
    | "dashRegionDefaultSources"
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
    | "symbolsColumnAddress"
    | "symbolsAbsoluteNote"
    | "symbolsNoSizeNote"
    | "symbolsDetailTitle"
    | "symbolsDetailHint"
    | "symbolsDetailName"
    | "symbolsDetailAddress"
    | "symbolsDetailSize"
    | "symbolsDetailType"
    | "symbolsDetailSection"
    | "objectsMapTitle"
    | "objectsMapHint"
    | "objectsMapEmpty"
    | "objectsMapBack"
    | "objectsTopTitle"
    | "objectsTopHint"
    | "objectsTopEmpty"
    | "objectsLibrariesTitle"
    | "objectsLibrariesHint"
    | "objectsSectionsTitle"
    | "objectsSectionsHint"
    | "objectsZeroSymbols"
    | "findingsStatusNotRun"
    | "findingsStatusClear"
    | "findingsSeverityWarn"
    | "findingsSeverityInfo"
    | "findingsValue"
    | "findingsItems"
    | "findingsCount"
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
    navLookup: "地址反查",
    navSettings: "设置",
    pageDashboard: "仪表盘",
    pageSymbols: "符号分析",
    pageObjects: "对象与映射",
    pageFindings: "问题扫描",
    pageLookup: "地址反查",
    pageSettings: "设置",
    toolchainReady: "工具链已就绪",
    toolchainMissing: "工具链未配置",
    toolchainDetectSuccess: "已自动识别工具链",
    toolchainDetectFailed: "未能自动识别工具链",
    newAnalysis: "新建分析",
    analysisHint: "选择 ELF 和 MAP 后即可开始分析。",
    analysisSelectElfTitle: "选择固件 ELF",
    analysisSelectMapTitle: "选择 MAP 文件（可选）",
    analysisElfLabel: "ELF",
    analysisMapLabel: "MAP",
    analysisNotSet: "未选择",
    analysisNeedToolchain: "请先配置工具链路径",
    analysisMissingElf: "请先选择 ELF 文件",
    analysisRunCurrent: "使用当前输入分析",
    analysisStart: "开始分析",
    analysisFailed: "分析失败：{msg}",
    analysisStatusTitle: "分析状态",
    analysisStatusIdle: "空闲",
    analysisStatusRunning: "执行中",
    analysisStatusSuccess: "成功",
    analysisStatusError: "失败",
    analysisStatusNone: "尚未运行",
    analysisStatusDetail: "当前状态：{status}",
    analysisSourceMap: "来源：MAP",
    analysisSourceEstimate: "来源：Section 估算",
    analysisCacheHit: "缓存命中",
    analysisCacheMiss: "新鲜计算",
    lookupTitle: "PC 地址反查",
    lookupHint: "输入 PC 地址（十六进制或十进制）以定位函数符号。",
    lookupPlaceholder: "例如：0x08001234",
    lookupNeedAnalysis: "请先运行分析以加载符号表",
    lookupNotFound: "未找到匹配符号",
    lookupOffset: "偏移",
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
    settingsDetect: "自动探测",
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
    dashInputTitle: "分析输入",
    dashInputHint: "当前选择的固件与映射文件。",
    dashRegionsTitle: "内存区域",
    dashRegionsHint: "来自 MAP 的内存区域配置与占用。",
    dashRegionsUsageNote: "已用统计按 VMA 归属区域，不包含对齐填充；FLASH 不含 .data 的 LMA 镜像。",
    dashRegionsBasisLabel: "统计口径",
    dashRegionsBasisVma: "VMA",
    dashRegionsBasisLd: "LD",
    dashRegionsUsageNoteVma: "按 VMA 归属区域统计，不包含对齐填充；FLASH 不含 .data 的 LMA 镜像。",
    dashRegionsUsageNoteLd: "按 VMA 统计，FLASH 额外计入 .data 的 LMA 镜像，并计入对齐填充。",
    dashRegionName: "区域",
    dashRegionOrigin: "起始",
    dashRegionLength: "长度",
    dashRegionUsed: "已用",
    dashRegionDefaultTag: "默认区域",
    dashRegionDefaultHint: "链接器兜底区域：未显式归属到 RAM/FLASH 的段会落在这里。",
    dashRegionDefaultSources: "占用来源",
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
    symbolsColumnAddress: "地址",
    symbolsAbsoluteNote: "绝对符号，无大小",
    symbolsNoSizeNote: "该符号无有效大小",
    symbolsDetailTitle: "符号详情",
    symbolsDetailHint: "点击表格行即可查看符号详情。",
    symbolsDetailName: "名称",
    symbolsDetailAddress: "地址",
    symbolsDetailSize: "大小",
    symbolsDetailType: "类型",
    symbolsDetailSection: "段",
    objectsMapTitle: "贡献树图",
    objectsMapHint: "Treemap 展示库、对象文件与段的层级关系。",
    objectsMapEmpty: "MAP 解析后显示 Treemap。",
    objectsMapBack: "返回上一级",
    objectsTopTitle: "对象贡献 Top",
    objectsTopHint: "按对象文件聚合的体积排行。",
    objectsTopEmpty: "暂无对象贡献数据",
    objectsLibrariesTitle: "库贡献 Top",
    objectsLibrariesHint: "按库文件聚合的体积排行。",
    objectsSectionsTitle: "段贡献 Top",
    objectsSectionsHint: "按段名称聚合的体积排行。",
    objectsZeroSymbols: "0 个符号",
    findingsStatusNotRun: "未运行",
    findingsStatusClear: "未命中",
    findingsSeverityWarn: "警告",
    findingsSeverityInfo: "提示",
    findingsValue: "体积",
    findingsItems: "命中项",
    findingsCount: "数量",
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
    navLookup: "Lookup",
    navSettings: "Settings",
    pageDashboard: "Dashboard",
    pageSymbols: "Symbols",
    pageObjects: "Objects & Map",
    pageFindings: "Findings",
    pageLookup: "Lookup",
    pageSettings: "Settings",
    toolchainReady: "Toolchain Ready",
    toolchainMissing: "Toolchain Missing",
    toolchainDetectSuccess: "Toolchain detected",
    toolchainDetectFailed: "Toolchain not found",
    newAnalysis: "New Analysis",
    analysisHint: "Select an ELF and MAP file to start analysis.",
    analysisSelectElfTitle: "Select ELF firmware",
    analysisSelectMapTitle: "Select MAP file (optional)",
    analysisElfLabel: "ELF",
    analysisMapLabel: "MAP",
    analysisNotSet: "Not set",
    analysisNeedToolchain: "Please configure the toolchain first.",
    analysisMissingElf: "Please select an ELF file.",
    analysisRunCurrent: "Analyze current inputs",
    analysisStart: "Analysis started",
    analysisFailed: "Analysis failed: {msg}",
    analysisStatusTitle: "Analysis Status",
    analysisStatusIdle: "Idle",
    analysisStatusRunning: "Running",
    analysisStatusSuccess: "Success",
    analysisStatusError: "Error",
    analysisStatusNone: "Not run",
    analysisStatusDetail: "Current status: {status}",
    analysisSourceMap: "Source: MAP",
    analysisSourceEstimate: "Source: section estimate",
    analysisCacheHit: "Cache hit",
    analysisCacheMiss: "Computed",
    lookupTitle: "PC Lookup",
    lookupHint: "Enter a PC address (hex or decimal) to resolve the symbol.",
    lookupPlaceholder: "e.g. 0x08001234",
    lookupNeedAnalysis: "Please run analysis to load symbols",
    lookupNotFound: "No matching symbol found",
    lookupOffset: "Offset",
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
    settingsDetect: "Auto-detect",
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
    dashInputTitle: "Analysis Inputs",
    dashInputHint: "Currently selected firmware and map files.",
    dashRegionsTitle: "Memory Regions",
    dashRegionsHint: "Memory regions from MAP and their usage.",
    dashRegionsUsageNote: "Used values follow VMA regions, excluding alignment padding; FLASH does not include .data LMA images.",
    dashRegionsBasisLabel: "Basis",
    dashRegionsBasisVma: "VMA",
    dashRegionsBasisLd: "LD",
    dashRegionsUsageNoteVma: "Uses VMA region totals; alignment padding excluded; FLASH excludes .data LMA images.",
    dashRegionsUsageNoteLd: "Uses VMA totals, adds .data LMA images to FLASH, and includes alignment padding.",
    dashRegionName: "Region",
    dashRegionOrigin: "Origin",
    dashRegionLength: "Length",
    dashRegionUsed: "Used",
    dashRegionDefaultTag: "Default",
    dashRegionDefaultHint: "Linker fallback region for sections not mapped to RAM/FLASH.",
    dashRegionDefaultSources: "Sources",
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
    symbolsColumnAddress: "Address",
    symbolsAbsoluteNote: "Absolute symbol, no size",
    symbolsNoSizeNote: "Symbol has no meaningful size",
    symbolsDetailTitle: "Symbol Details",
    symbolsDetailHint: "Select a row to view symbol details.",
    symbolsDetailName: "Name",
    symbolsDetailAddress: "Address",
    symbolsDetailSize: "Size",
    symbolsDetailType: "Type",
    symbolsDetailSection: "Section",
    objectsMapTitle: "Contribution Map",
    objectsMapHint: "Treemap view of libraries, object files, and sections.",
    objectsMapEmpty: "Treemap will appear after MAP parsing.",
    objectsMapBack: "Back",
    objectsTopTitle: "Top Objects",
    objectsTopHint: "Aggregated size by object file.",
    objectsTopEmpty: "No object data yet",
    objectsLibrariesTitle: "Top Libraries",
    objectsLibrariesHint: "Aggregated size by library.",
    objectsSectionsTitle: "Top Sections",
    objectsSectionsHint: "Aggregated size by section name.",
    objectsZeroSymbols: "0 symbols",
    findingsStatusNotRun: "Not run",
    findingsStatusClear: "Clear",
    findingsSeverityWarn: "Warning",
    findingsSeverityInfo: "Info",
    findingsValue: "Size",
    findingsItems: "Items",
    findingsCount: "Count",
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

export function uiText(language: Language, key: UiKey, vars?: Record<string, string | number>): string {
    const template = dictionaries[language]?.[key] ?? zh[key] ?? key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, name) => {
        const value = vars[name];
        return value == null ? "" : String(value);
    });
}
