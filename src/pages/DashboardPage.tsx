import { Button, Card, Col, Divider, Empty, Progress, Row, Segmented, Space, Table, Tag, Tooltip, Typography, message } from "antd";
import { useState } from "react";
import { InfoCircleOutlined } from "@ant-design/icons";
import { invoke } from "@tauri-apps/api/core";
import { uiText } from "../domain/uiI18n";
import type { AnalyzeParams } from "../domain/analyzeTypes";
import { type ToolchainCandidate, deriveRootFromNm } from "../domain/toolchain";
import { useAnalysisStore } from "../store/analysis.store";
import type { AnalysisResult } from "../store/analysis.store";
import { useSettingsStore } from "../store/settings.store";
import { useUiStore } from "../store/ui.store";

const formatBytes = (value?: number | null) => {
    if (value == null) return "--";
    if (value < 1024) return `${value} B`;
    const kb = value / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
};

const statusColor = (status: string) => {
    switch (status) {
        case "running":
            return "blue";
        case "success":
            return "green";
        case "error":
            return "red";
        default:
            return "default";
    }
};

export default function DashboardPage() {
    const language = useUiStore((s) => s.language);
    const inputs = useAnalysisStore((s) => s.inputs);
    const result = useAnalysisStore((s) => s.result);
    const status = useAnalysisStore((s) => s.status);
    const lastError = useAnalysisStore((s) => s.lastError);
    const setStatus = useAnalysisStore((s) => s.setStatus);
    const setResult = useAnalysisStore((s) => s.setResult);
    const toolchain = useSettingsStore((s) => s.toolchain);
    const updateToolchain = useSettingsStore((s) => s.updateToolchain);
    const [showUsedBytes, setShowUsedBytes] = useState(false);
    const [usageBasis, setUsageBasis] = useState<"vma" | "ld">("vma");
    const [msgApi, contextHolder] = message.useMessage();
    const toggleUsedUnit = () => setShowUsedBytes((prev) => !prev);
    const usageNoteKey = usageBasis === "ld" ? "dashRegionsUsageNoteLd" : "dashRegionsUsageNoteVma";
    const totals = result?.summary.sections_totals;
    const symbols = result?.summary.top_symbols ?? [];
    const regions = result?.summary.memory_regions ?? [];
    const cacheHit = result?.meta.cache?.hit ?? false;
    const hasToolchain = Boolean(
        toolchain.toolchainRoot || toolchain.nmPath || toolchain.objdumpPath || toolchain.stringsPath,
    );

    const flashBase = totals?.flash_region_bytes ?? totals?.flash_bytes ?? 0;
    const ramBase = totals?.ram_region_bytes ?? totals?.ram_bytes ?? 0;
    const estimatedFlashUsed = totals?.flash_bytes ?? 0;
    const estimatedRamUsed = totals?.ram_bytes ?? 0;

    const statusLabel = (() => {
        switch (status) {
            case "running":
                return uiText(language, "analysisStatusRunning");
            case "success":
                return uiText(language, "analysisStatusSuccess");
            case "error":
                return uiText(language, "analysisStatusError");
            default:
                return uiText(language, "analysisStatusIdle");
        }
    })();

    const topSymbolColumns = [
        {
            title: uiText(language, "symbolsColumnSymbol"),
            dataIndex: "name",
            key: "name",
            ellipsis: true,
        },
        {
            title: uiText(language, "symbolsColumnSize"),
            dataIndex: "size",
            key: "size",
            render: (value: number) => formatBytes(value),
            width: 120,
        },
        { title: uiText(language, "symbolsColumnSection"), dataIndex: "section_guess", key: "section", width: 120 },
    ];

    const estimateRegionUsed = (name: string) => {
        const lower = String(name || "").toLowerCase();
        if (lower.includes("flash") || lower.includes("rom")) return estimatedFlashUsed;
        if (lower.includes("ram") || lower.includes("sram")) return estimatedRamUsed;
        return 0;
    };

    const detectToolchain = async (notify: boolean) => {
        try {
            const candidates = await invoke<ToolchainCandidate[]>("detect_toolchain", {
                config: {
                    auto_detect: toolchain.autoDetect,
                    toolchain_root: toolchain.toolchainRoot || null,
                    nm_path: toolchain.nmPath || null,
                    objdump_path: toolchain.objdumpPath || null,
                    strings_path: toolchain.stringsPath || null,
                },
            });
            if (!candidates || candidates.length === 0) {
                if (notify) {
                    msgApi.warning(uiText(language, "toolchainDetectFailed"));
                }
                return false;
            }
            const candidate = candidates[0];
            const derivedRoot = deriveRootFromNm(candidate.paths.nm_path);
            updateToolchain({
                toolchainRoot: derivedRoot || toolchain.toolchainRoot,
                nmPath: candidate.paths.nm_path,
                objdumpPath: candidate.paths.objdump_path,
                stringsPath: candidate.paths.strings_path,
                lastDetected: candidate.source,
            });
            if (notify) {
                msgApi.success(uiText(language, "toolchainDetectSuccess"));
            }
            return true;
        } catch (error: unknown) {
            if (notify) {
                const messageText = error instanceof Error ? error.message : String(error);
                msgApi.error(messageText);
            }
            return false;
        }
    };

    const runWithCurrentInputs = async () => {
        if (!inputs.elfPath) {
            msgApi.info(uiText(language, "analysisMissingElf"));
            return;
        }

        if (toolchain.autoDetect && !hasToolchain) {
            const detected = await detectToolchain(false);
            if (!detected) {
                msgApi.warning(uiText(language, "analysisNeedToolchain"));
                return;
            }
        }

        if (!toolchain.autoDetect && !hasToolchain) {
            msgApi.warning(uiText(language, "analysisNeedToolchain"));
            return;
        }

        setStatus("running");
        msgApi.loading(uiText(language, "analysisStart"), 0.8);

        const params: AnalyzeParams = {
            elf_path: inputs.elfPath,
            map_path: inputs.mapPath || null,
            toolchain: {
                auto_detect: toolchain.autoDetect,
                toolchain_root: toolchain.toolchainRoot || null,
                nm_path: toolchain.nmPath || null,
                objdump_path: toolchain.objdumpPath || null,
                strings_path: toolchain.stringsPath || null,
            },
        };

        try {
            const analysisResult = await invoke<AnalysisResult>("analyze_firmware", { params });
            setResult(analysisResult);
            setStatus("success");
            msgApi.success(uiText(language, "analysisStart"));
        } catch (error: unknown) {
            const messageText = error instanceof Error ? error.message : String(error);
            setStatus("error", messageText);
            msgApi.error(uiText(language, "analysisFailed", { msg: messageText }));
        }
    };

    const regionColumns = [
        {
            title: uiText(language, "dashRegionName"),
            dataIndex: "name",
            key: "name",
            render: (value: string, record: { sources?: { name: string; size: number }[] }) => {
                const isDefault = String(value).toLowerCase().includes("default");
                if (!isDefault) return value;
                const sources = record.sources ?? [];
                const sourcesLabel = sources.length
                    ? sources.map((item) => `${item.name} (${formatBytes(item.size)})`).join("\n")
                    : uiText(language, "dashNoData");
                return (
                    <Space size="small">
                        <span>{value}</span>
                        <Tooltip
                            title={
                                <Space direction="vertical" size={4}>
                                    <Typography.Text>{uiText(language, "dashRegionDefaultHint")}</Typography.Text>
                                    <Typography.Text className="tooltipMuted">
                                        {uiText(language, "dashRegionDefaultSources")}
                                    </Typography.Text>
                                    <Typography.Text style={{ whiteSpace: "pre-line" }}>{sourcesLabel}</Typography.Text>
                                </Space>
                            }
                        >
                            <Tag>{uiText(language, "dashRegionDefaultTag")}</Tag>
                        </Tooltip>
                    </Space>
                );
            },
        },
        { title: uiText(language, "dashRegionOrigin"), dataIndex: "origin", key: "origin" },
        {
            title: uiText(language, "dashRegionLength"),
            dataIndex: "length",
            key: "length",
            render: (value: number) => formatBytes(value),
        },
        {
            title: uiText(language, "dashRegionUsed"),
            key: "used",
            render: (_: unknown, record: { used?: number | null; length: number; name: string; padding_bytes?: number | null }) => {
                const usedValue = record.used ?? estimateRegionUsed(record.name);
                if (!usedValue) {
                    return (
                        <Typography.Text type="secondary">
                            -- / {formatBytes(record.length)}
                        </Typography.Text>
                    );
                }
                const isFlash = /flash|rom/i.test(record.name);
                const usedFromEstimate = record.used == null;
                const paddingBytes = record.padding_bytes ?? 0;
                const includePadding = usageBasis === "ld" && !usedFromEstimate;
                let adjustedUsed = usedValue;
                if (usageBasis === "ld" && isFlash && !usedFromEstimate) {
                    adjustedUsed += totals?.data_bytes ?? 0;
                }
                if (includePadding) {
                    adjustedUsed += paddingBytes;
                }
                const percent = record.length > 0 ? Math.min(100, (adjustedUsed / record.length) * 100) : 0;
                const over = adjustedUsed > record.length;
                const usedLabel = showUsedBytes ? `${adjustedUsed} B` : formatBytes(adjustedUsed);
                const lengthLabel = showUsedBytes ? `${record.length} B` : formatBytes(record.length);
                return (
                    <div
                        className="regionUsedCell"
                        role="button"
                        tabIndex={0}
                        onClick={toggleUsedUnit}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                toggleUsedUnit();
                            }
                        }}
                        style={{ cursor: "pointer" }}
                    >
                        <Space direction="vertical" size={4}>
                            <Progress
                                percent={Number(percent.toFixed(1))}
                                size="small"
                                status={over ? "exception" : "normal"}
                                showInfo
                            />
                            <Typography.Text type={over ? "danger" : "secondary"}>
                                {usedLabel} / {lengthLabel}
                            </Typography.Text>
                        </Space>
                    </div>
                );
            },
        },
    ];

    const canRunCurrent = Boolean(inputs.elfPath) && status !== "running";

    return (
        <>
            {contextHolder}
            <Space direction="vertical" size="large" className="pageStack">
                                <Row gutter={[16, 16]} align="stretch">
                    <Col xs={24} lg={14}>
                        <Card className="pageCard riseIn" style={{ animationDelay: "120ms", height: "100%" }}>
                                                    <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
                                                        <div>
                                                            <Typography.Title level={4}>{uiText(language, "dashInputTitle")}</Typography.Title>
                                                            <Typography.Text type="secondary">{uiText(language, "dashInputHint")}</Typography.Text>
                                                        </div>
                                                        <Space direction="vertical" size={4} align="end">
                                                            <Button
                                                                type="primary"
                                                                onClick={runWithCurrentInputs}
                                                                disabled={!canRunCurrent}
                                                                loading={status === "running"}
                                                            >
                                                                {uiText(language, "analysisRunCurrent")}
                                                            </Button>
                                                            <Space size="small" align="center" wrap>
                                                                <Typography.Text type="secondary">
                                                                    {uiText(language, "analysisStatusDetail", { status: statusLabel })}
                                                                </Typography.Text>
                                                                <Tag color={statusColor(status)} className="statusTag">
                                                                    {statusLabel}
                                                                </Tag>
                                                                {result ? (
                                                                    <Tag color={cacheHit ? "green" : "default"}>
                                                                        {cacheHit
                                                                            ? uiText(language, "analysisCacheHit")
                                                                            : uiText(language, "analysisCacheMiss")}
                                                                    </Tag>
                                                                ) : null}
                                                            </Space>
                                                            {status === "idle" ? (
                                                                <Typography.Text type="secondary">{uiText(language, "analysisStatusNone")}</Typography.Text>
                                                            ) : null}
                                                            {status === "error" && lastError ? (
                                                                <Typography.Text type="danger">{lastError}</Typography.Text>
                                                            ) : null}
                                                        </Space>
                                                    </Space>
                                                    <Divider />
                                                    <Space direction="vertical" size="small" className="pathList">
                                                        <div className="pathRow">
                                                            <Typography.Text strong>{uiText(language, "analysisElfLabel")}</Typography.Text>
                                                            <Typography.Text className="pathValue">
                                                                {inputs.elfPath || uiText(language, "analysisNotSet")}
                                                            </Typography.Text>
                                                        </div>
                                                        <div className="pathRow">
                                                            <Typography.Text strong>{uiText(language, "analysisMapLabel")}</Typography.Text>
                                                            <Typography.Text className="pathValue">
                                                                {inputs.mapPath || uiText(language, "analysisNotSet")}
                                                            </Typography.Text>
                                                        </div>
                                                    </Space>
                                                </Card>
                    </Col>
                    <Col xs={24} lg={10}>
                        <Card className="pageCard riseIn" style={{ animationDelay: "280ms", height: "100%" }}>
                                                    <Typography.Title level={4}>{uiText(language, "dashSectionFootprintTitle")}</Typography.Title>
                                                    <Typography.Text type="secondary">
                                                        {uiText(language, "dashSectionFootprintHint")}
                                                    </Typography.Text>
                                                    <Divider />
                                                    <Space direction="vertical" size="small" className="progressStack">
                                                        <div className="progressRow">
                                                            <span>.text {formatBytes(totals?.text_bytes ?? null)}</span>
                                                            <Progress
                                                                percent={
                                                                    totals?.text_bytes
                                                                        ? Number(((totals.text_bytes / (flashBase || 1)) * 100).toFixed(1))
                                                                        : 0
                                                                }
                                                                showInfo
                                                            />
                                                        </div>
                                                        <div className="progressRow">
                                                            <span>.rodata {formatBytes(totals?.rodata_bytes ?? null)}</span>
                                                            <Progress
                                                                percent={
                                                                    totals?.rodata_bytes
                                                                        ? Number(((totals.rodata_bytes / (flashBase || 1)) * 100).toFixed(1))
                                                                        : 0
                                                                }
                                                                showInfo
                                                            />
                                                        </div>
                                                        <div className="progressRow">
                                                            <span>.data {formatBytes(totals?.data_bytes ?? null)}</span>
                                                            <Progress
                                                                percent={
                                                                    totals?.data_bytes
                                                                        ? Number(((totals.data_bytes / (flashBase || 1)) * 100).toFixed(1))
                                                                        : 0
                                                                }
                                                                showInfo
                                                            />
                                                        </div>
                                                        <div className="progressRow">
                                                            <span>.bss {formatBytes(totals?.bss_bytes ?? null)}</span>
                                                            <Progress
                                                                percent={
                                                                    totals?.bss_bytes
                                                                        ? Number(((totals.bss_bytes / (ramBase || 1)) * 100).toFixed(1))
                                                                        : 0
                                                                }
                                                                showInfo
                                                            />
                                                        </div>
                                                    </Space>
                                                </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={24}>
                        <Card className="pageCard riseIn" style={{ animationDelay: "260ms" }}>
                            <Space size="small" align="center" wrap>
                                <Typography.Title level={4}>{uiText(language, "dashRegionsTitle")}</Typography.Title>
                                <Tooltip title={uiText(language, usageNoteKey)}>
                                    <InfoCircleOutlined style={{ color: "rgba(0, 0, 0, 0.45)" }} />
                                </Tooltip>
                                <Space size="small" align="center">
                                    <Typography.Text type="secondary">{uiText(language, "dashRegionsBasisLabel")}</Typography.Text>
                                    <Segmented
                                        size="small"
                                        value={usageBasis}
                                        onChange={(value) => setUsageBasis(value as "vma" | "ld")}
                                        options={[
                                            { label: uiText(language, "dashRegionsBasisVma"), value: "vma" },
                                            { label: uiText(language, "dashRegionsBasisLd"), value: "ld" },
                                        ]}
                                    />
                                </Space>
                            </Space>
                            <Typography.Text type="secondary">{uiText(language, "dashRegionsHint")}</Typography.Text>
                            <Divider />
                            <Table
                                columns={regionColumns}
                                dataSource={regions}
                                rowKey={(row) => row.name}
                                pagination={false}
                                size="small"
                                locale={{ emptyText: <Empty description={uiText(language, "objectsMapEmpty")} /> }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={24}>
                        <Card className="pageCard riseIn" style={{ animationDelay: "320ms" }}>
                            <Typography.Title level={4}>{uiText(language, "dashTopSymbolsTitle")}</Typography.Title>
                            <Typography.Text type="secondary">{uiText(language, "dashTopSymbolsHint")}</Typography.Text>
                            <Divider />
                            <Table
                                columns={topSymbolColumns}
                                dataSource={symbols}
                                rowKey={(row) => row.name}
                                pagination={false}
                                locale={{ emptyText: <Empty description={uiText(language, "dashTopSymbolsEmpty")} /> }}
                            />
                        </Card>
                    </Col>
                </Row>
            </Space>
        </>
    );
}
