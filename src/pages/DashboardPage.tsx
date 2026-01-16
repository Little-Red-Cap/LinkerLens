import { Card, Col, Divider, Empty, Progress, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import { uiText } from "../domain/uiI18n";
import { useAnalysisStore } from "../store/analysis.store";
import { useUiStore } from "../store/ui.store";

const formatBytes = (value?: number) => {
    if (!value) return "--";
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
    const totals = result?.summary.sections_totals;
    const symbols = result?.summary.top_symbols ?? [];
    const regions = result?.summary.memory_regions ?? [];

    const summaryStats = [
        {
            label: uiText(language, "dashFlashUsed"),
            value: formatBytes(totals?.flashBytes ?? 0),
            hint: totals ? "" : uiText(language, "dashAwaiting"),
        },
        {
            label: uiText(language, "dashRamUsed"),
            value: formatBytes(totals?.ramBytes ?? 0),
            hint: totals ? "" : uiText(language, "dashAwaiting"),
        },
        {
            label: uiText(language, "dashBss"),
            value: formatBytes(totals?.bssBytes ?? 0),
            hint: totals ? "" : uiText(language, "dashNoData"),
        },
        {
            label: uiText(language, "dashData"),
            value: formatBytes(totals?.dataBytes ?? 0),
            hint: totals ? "" : uiText(language, "dashNoData"),
        },
    ];

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
        { title: uiText(language, "symbolsColumnSymbol"), dataIndex: "name", key: "name" },
        { title: uiText(language, "symbolsColumnSize"), dataIndex: "size", key: "size" },
        { title: uiText(language, "symbolsColumnSection"), dataIndex: "section_guess", key: "section" },
    ];

    const regionColumns = [
        { title: uiText(language, "dashRegionName"), dataIndex: "name", key: "name" },
        { title: uiText(language, "dashRegionOrigin"), dataIndex: "origin", key: "origin" },
        { title: uiText(language, "dashRegionLength"), dataIndex: "length", key: "length" },
        { title: uiText(language, "dashRegionUsed"), dataIndex: "used", key: "used" },
    ];

    return (
        <Space direction="vertical" size="large" className="pageStack">
            <Row gutter={[16, 16]}>
                {summaryStats.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={stat.label}>
                        <Card className="pageCard riseIn" style={{ animationDelay: `${index * 80}ms` }}>
                            <Statistic title={stat.label} value={stat.value} />
                            {stat.hint ? (
                                <Typography.Text type="secondary" className="cardHint">
                                    {stat.hint}
                                </Typography.Text>
                            ) : null}
                        </Card>
                    </Col>
                ))}
            </Row>

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
                        </Space>
                    </Card>
                </Col>
            </Row>

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
                                <span>.text</span>
                                <Progress
                                    percent={totals?.textBytes ? (totals.textBytes / (totals.flashBytes || 1)) * 100 : 0}
                                    showInfo={false}
                                />
                            </div>
                            <div className="progressRow">
                                <span>.rodata</span>
                                <Progress
                                    percent={totals?.rodataBytes ? (totals.rodataBytes / (totals.flashBytes || 1)) * 100 : 0}
                                    showInfo={false}
                                />
                            </div>
                            <div className="progressRow">
                                <span>.data</span>
                                <Progress
                                    percent={totals?.dataBytes ? (totals.dataBytes / (totals.flashBytes || 1)) * 100 : 0}
                                    showInfo={false}
                                />
                            </div>
                            <div className="progressRow">
                                <span>.bss</span>
                                <Progress
                                    percent={totals?.bssBytes ? (totals.bssBytes / (totals.ramBytes || 1)) * 100 : 0}
                                    showInfo={false}
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
        </Space>
    );
}
