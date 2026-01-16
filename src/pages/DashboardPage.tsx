import { Card, Col, Divider, Empty, Progress, Row, Space, Statistic, Table, Typography } from "antd";
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

export default function DashboardPage() {
    const language = useUiStore((s) => s.language);
    const inputs = useAnalysisStore((s) => s.inputs);
    const result = useAnalysisStore((s) => s.result);
    const totals = result?.summary.sections_totals;
    const symbols = result?.summary.top_symbols ?? [];

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

    const topSymbolColumns = [
        { title: uiText(language, "symbolsColumnSymbol"), dataIndex: "name", key: "name" },
        { title: uiText(language, "symbolsColumnSize"), dataIndex: "size", key: "size" },
        { title: uiText(language, "symbolsColumnSection"), dataIndex: "section_guess", key: "section" },
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
        </Space>
    );
}
