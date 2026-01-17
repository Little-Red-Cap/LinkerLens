import { Card, Col, Divider, Empty, Progress, Row, Space, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { uiText } from "../domain/uiI18n";
import { useAnalysisStore } from "../store/analysis.store";
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
    const [showUsedBytes, setShowUsedBytes] = useState(false);
    const totals = result?.summary.sections_totals;
    const symbols = result?.summary.top_symbols ?? [];
    const regions = result?.summary.memory_regions ?? [];
    const cacheHit = result?.meta.cache?.hit ?? false;

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

    const regionColumns = [
        { title: uiText(language, "dashRegionName"), dataIndex: "name", key: "name" },
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
            render: (_: unknown, record: { used?: number | null; length: number; name: string }) => {
                const usedValue = record.used ?? estimateRegionUsed(record.name);
                if (!usedValue) {
                    return (
                        <Typography.Text type="secondary">
                            -- / {formatBytes(record.length)}
                        </Typography.Text>
                    );
                }
                const percent = record.length > 0 ? Math.min(100, (usedValue / record.length) * 100) : 0;
                const over = usedValue > record.length;
                const usedLabel = showUsedBytes ? `${usedValue} B` : formatBytes(usedValue);
                const lengthLabel = showUsedBytes ? `${record.length} B` : formatBytes(record.length);
                return (
                    <Space direction="vertical" size={4}>
                        <Progress
                            percent={Number(percent.toFixed(1))}
                            size="small"
                            status={over ? "exception" : "normal"}
                            showInfo
                        />
                        <Typography.Text
                            type={over ? "danger" : "secondary"}
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowUsedBytes((prev) => !prev)}
                        >
                            {usedLabel} / {lengthLabel}
                        </Typography.Text>
                    </Space>
                );
            },
        },
    ];

    return (
        <Space direction="vertical" size="large" className="pageStack">
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                    <Card className="pageCard riseIn" style={{ animationDelay: "120ms" }}>
                        <Typography.Title level={4}>{uiText(language, "dashInputTitle")}</Typography.Title>
                        <Typography.Text type="secondary">{uiText(language, "dashInputHint")}</Typography.Text>
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
                <Col xs={24} lg={12}>
                    <Card className="pageCard riseIn" style={{ animationDelay: "140ms" }}>
                        <Typography.Title level={4}>{uiText(language, "analysisStatusTitle")}</Typography.Title>
                        <Typography.Text type="secondary">
                            {uiText(language, "analysisStatusDetail", { status: statusLabel })}
                        </Typography.Text>
                        <Divider />
                        <Space direction="vertical" size="small">
                            <Tag color={statusColor(status)} className="statusTag">
                                {statusLabel}
                            </Tag>
                            <Typography.Text type="secondary">
                                {status === "idle"
                                    ? uiText(language, "analysisStatusNone")
                                    : status === "error" && lastError
                                        ? lastError
                                        : ""}
                            </Typography.Text>
                            {result ? (
                                <Tag color={cacheHit ? "green" : "default"}>
                                    {cacheHit ? uiText(language, "analysisCacheHit") : uiText(language, "analysisCacheMiss")}
                                </Tag>
                            ) : null}
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Card className="pageCard riseIn" style={{ animationDelay: "260ms" }}>
                <Typography.Title level={4}>{uiText(language, "dashRegionsTitle")}</Typography.Title>
                <Typography.Text type="secondary">{uiText(language, "dashRegionsHint")}</Typography.Text>
                <Divider />
                <Table
                    columns={regionColumns}
                    dataSource={regions}
                    rowKey={(row) => row.name}
                    pagination={false}
                    locale={{ emptyText: <Empty description={uiText(language, "objectsMapEmpty")} /> }}
                />
            </Card>

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                    <Card className="pageCard riseIn" style={{ animationDelay: "180ms" }}>
                        <Typography.Title level={4}>
                            {uiText(language, "dashSectionFootprintTitle")}
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            {uiText(language, "dashSectionFootprintHint")}
                        </Typography.Text>
                        <Divider />
                        <Space direction="vertical" size="small" className="progressStack">
                            <div className="progressRow">
                                <span>.text {formatBytes(totals?.text_bytes ?? null)}</span>
                                <Progress
                                    percent={
                                        totals?.text_bytes ? Number(((totals.text_bytes / (flashBase || 1)) * 100).toFixed(1)) : 0
                                    }
                                    showInfo
                                />
                            </div>
                            <div className="progressRow">
                                <span>.rodata {formatBytes(totals?.rodata_bytes ?? null)}</span>
                                <Progress
                                    percent={
                                        totals?.rodata_bytes ? Number(((totals.rodata_bytes / (flashBase || 1)) * 100).toFixed(1)) : 0
                                    }
                                    showInfo
                                />
                            </div>
                            <div className="progressRow">
                                <span>.data {formatBytes(totals?.data_bytes ?? null)}</span>
                                <Progress
                                    percent={
                                        totals?.data_bytes ? Number(((totals.data_bytes / (flashBase || 1)) * 100).toFixed(1)) : 0
                                    }
                                    showInfo
                                />
                            </div>
                            <div className="progressRow">
                                <span>.bss {formatBytes(totals?.bss_bytes ?? null)}</span>
                                <Progress
                                    percent={
                                        totals?.bss_bytes ? Number(((totals.bss_bytes / (ramBase || 1)) * 100).toFixed(1)) : 0
                                    }
                                    showInfo
                                />
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card className="pageCard riseIn" style={{ animationDelay: "220ms" }}>
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
    );
}

