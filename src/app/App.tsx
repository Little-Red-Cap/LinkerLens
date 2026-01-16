import { useEffect, useMemo, useState } from "react";
import {
    Badge,
    Button,
    ConfigProvider,
    Grid,
    Layout,
    Menu,
    Select,
    Space,
    Switch,
    Tag,
    Tooltip,
    Typography,
    message,
    theme as antdTheme,
} from "antd";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import {
    AlertOutlined,
    ApartmentOutlined,
    DashboardOutlined,
    PlayCircleOutlined,
    SettingOutlined,
    TableOutlined,
} from "@ant-design/icons";
import DashboardPage from "../pages/DashboardPage";
import FindingsPage from "../pages/FindingsPage";
import ObjectsPage from "../pages/ObjectsPage";
import SettingsPage from "../pages/SettingsPage";
import SymbolsPage from "../pages/SymbolsPage";
import { uiText } from "../domain/uiI18n";
import { useAnalysisStore } from "../store/analysis.store";
import { useSettingsStore } from "../store/settings.store";
import { useUiStore } from "../store/ui.store";
import "../App.css";

const { Header, Content } = Layout;

type PageKey = "dashboard" | "symbols" | "objects" | "findings" | "settings";

type AnalyzeParams = {
    elf_path: string;
    map_path?: string | null;
    toolchain?: {
        auto_detect: boolean;
        toolchain_root?: string | null;
        nm_path?: string | null;
        objdump_path?: string | null;
        strings_path?: string | null;
    };
};

export default function App() {
    const [activePage, setActivePage] = useState<PageKey>("dashboard");
    const screens = Grid.useBreakpoint();
    const isCompact = useMemo(() => !screens.md, [screens.md]);
    const toolchain = useSettingsStore((s) => s.toolchain);
    const themeMode = useUiStore((s) => s.theme);
    const language = useUiStore((s) => s.language);
    const setTheme = useUiStore((s) => s.setTheme);
    const setLanguage = useUiStore((s) => s.setLanguage);
    const setInputs = useAnalysisStore((s) => s.setInputs);
    const setStatus = useAnalysisStore((s) => s.setStatus);
    const setResult = useAnalysisStore((s) => s.setResult);
    const [msgApi, contextHolder] = message.useMessage();

    useEffect(() => {
        document.documentElement.dataset.theme = themeMode;
        document.documentElement.dataset.lang = language;
    }, [themeMode, language]);

    const pageTitle: Record<PageKey, string> = {
        dashboard: uiText(language, "pageDashboard"),
        symbols: uiText(language, "pageSymbols"),
        objects: uiText(language, "pageObjects"),
        findings: uiText(language, "pageFindings"),
        settings: uiText(language, "pageSettings"),
    };

    const menuItems = [
        { key: "dashboard", label: uiText(language, "navDashboard"), icon: <DashboardOutlined /> },
        { key: "symbols", label: uiText(language, "navSymbols"), icon: <TableOutlined /> },
        { key: "objects", label: uiText(language, "navObjects"), icon: <ApartmentOutlined /> },
        { key: "findings", label: uiText(language, "navFindings"), icon: <AlertOutlined /> },
        { key: "settings", label: uiText(language, "navSettings"), icon: <SettingOutlined /> },
    ];

    const content = (() => {
        switch (activePage) {
            case "dashboard":
                return <DashboardPage />;
            case "symbols":
                return <SymbolsPage />;
            case "objects":
                return <ObjectsPage />;
            case "findings":
                return <FindingsPage />;
            case "settings":
                return <SettingsPage />;
            default:
                return null;
        }
    })();

    const hasToolchain = Boolean(
        toolchain.toolchainRoot || toolchain.nmPath || toolchain.objdumpPath || toolchain.stringsPath,
    );

    const startAnalysis = async () => {
        const elfSelected = await open({
            title: uiText(language, "analysisSelectElfTitle"),
            multiple: false,
            filters: [{ name: "ELF", extensions: ["elf"] }],
        });
        const elfPath = Array.isArray(elfSelected) ? elfSelected[0] : elfSelected;
        if (!elfPath || typeof elfPath !== "string") return;

        setInputs({ elfPath });

        const mapSelected = await open({
            title: uiText(language, "analysisSelectMapTitle"),
            multiple: false,
            filters: [{ name: "MAP", extensions: ["map"] }],
        });
        const mapPath = Array.isArray(mapSelected) ? mapSelected[0] : mapSelected;
        if (mapPath && typeof mapPath === "string") {
            setInputs({ mapPath });
        }

        setActivePage("dashboard");
        setStatus("running");

        const params: AnalyzeParams = {
            elf_path: elfPath,
            map_path: typeof mapPath === "string" ? mapPath : null,
            toolchain: {
                auto_detect: toolchain.autoDetect,
                toolchain_root: toolchain.toolchainRoot || null,
                nm_path: toolchain.nmPath || null,
                objdump_path: toolchain.objdumpPath || null,
                strings_path: toolchain.stringsPath || null,
            },
        };

        try {
            const result = await invoke("analyze_firmware", { params });
            setResult(result as any);
            setStatus("success");
            msgApi.success("\u5206\u6790\u5b8c\u6210");
        } catch (error: any) {
            const messageText = error?.message || String(error);
            setStatus("error", messageText);
            msgApi.error(messageText);
        }
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: themeMode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                token: {
                    colorPrimary: "#1b6b5f",
                    borderRadius: 12,
                    fontFamily: '"Bahnschrift", "Trebuchet MS", "Yu Gothic", "PingFang SC", sans-serif',
                },
            }}
        >
            {contextHolder}
            <div className="appShell">
                <Header className="appHeader">
                    <div className="appHeaderInner">
                        <div className="appBrand">
                            <Badge color="#c37a3a" />
                            <div>
                                <Typography.Text className="appTitle">LinkerLens</Typography.Text>
                                <Typography.Text className="appSubtitle">
                                    {uiText(language, "subtitle")}
                                </Typography.Text>
                            </div>
                        </div>
                        <div className="appHeaderSpacer" />
                        <Space size="middle" className="appHeaderActions">
                            <Tag color={hasToolchain ? "green" : "orange"}>
                                {hasToolchain
                                    ? uiText(language, "toolchainReady")
                                    : uiText(language, "toolchainMissing")}
                            </Tag>
                            <Space size="small" className="appHeaderSwitches">
                                <span className="labelText">{uiText(language, "theme")}</span>
                                <Switch
                                    checked={themeMode === "dark"}
                                    onChange={(checked) => setTheme(checked ? "dark" : "light")}
                                />
                            </Space>
                            <Space size="small" className="appHeaderSwitches">
                                <span className="labelText">{uiText(language, "language")}</span>
                                <Select
                                    value={language}
                                    onChange={(value) => setLanguage(value)}
                                    options={[
                                        { value: "zh", label: "\u4e2d\u6587" },
                                        { value: "en", label: "English" },
                                    ]}
                                    className="langSelect"
                                />
                            </Space>
                            <Tooltip title={uiText(language, "analysisHint")}>
                                <Button type="primary" icon={<PlayCircleOutlined />} onClick={startAnalysis}>
                                    {uiText(language, "newAnalysis")}
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>
                </Header>
                <Layout className="appBody">
                    <aside className={`appNav ${isCompact ? "isCompact" : ""}`}>
                        <Menu
                            mode={isCompact ? "horizontal" : "inline"}
                            selectedKeys={[activePage]}
                            onClick={(e) => setActivePage(e.key as PageKey)}
                            items={menuItems}
                        />
                    </aside>
                    <Content className="appContent">
                        <div className="pageHeader">
                            <Typography.Title level={2} className="pageTitle">
                                {pageTitle[activePage]}
                            </Typography.Title>
                            <div className="pageMeta">
                                <Typography.Text type="secondary">
                                    {toolchain.autoDetect
                                        ? uiText(language, "autoDetectEnabled")
                                        : uiText(language, "manualToolchain")}
                                </Typography.Text>
                            </div>
                        </div>
                        <div className="pageBody">{content}</div>
                    </Content>
                </Layout>
            </div>
        </ConfigProvider>
    );
}
