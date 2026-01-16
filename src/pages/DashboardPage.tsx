import { Card, Col, Divider, Empty, Progress, Row, Space, Statistic, Table, Typography } from "antd";
import { uiText } from "../domain/uiI18n";
import { useAnalysisStore } from "../store/analysis.store";
import { useUiStore } from "../store/ui.store";

export default function DashboardPage() {
    const language = useUiStore((s) => s.language);
    const inputs = useAnalysisStore((s) => s.inputs);
    const summaryStats = [
        { label: uiText(language, "dashFlashUsed"), value: "--", hint: uiText(language, "dashAwaiting") },
        { label: uiText(language, "dashRamUsed"), value: "--", hint: uiText(language, "dashAwaiting") },
        { label: uiText(language, "dashBss"), value: "--", hint: uiText(language, "dashNoData") },
        { label: uiText(language, "dashData"), value: "--", hint: uiText(language, "dashNoData") },
    ];

    const topSymbolColumns = [
        { title: uiText(language, "symbolsColumnSymbol"), dataIndex: "name", key: "name" },
        { title: uiText(language, "symbolsColumnSize"), dataIndex: "size", key: "size" },
        { title: uiText(language, "symbolsColumnSection"), dataIndex: "section", key: "section" },
    ];

    return (
        <Space direction="vertical" size="large" className="pageStack">
            <Row gutter={[16, 16]}>
                {summaryStats.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={stat.label}>
                        <Card className="pageCard riseIn" style={{ animationDelay: `${index * 80}ms` }}>
                            <Statistic title={stat.label} value={stat.value} />
                            <Typography.Text type="secondary" className="cardHint">
                                {stat.hint}
                            </Typography.Text>
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
                                <Progress percent={0} showInfo={false} />
                            </div>
                            <div className="progressRow">
                                <span>.rodata</span>
                                <Progress percent={0} showInfo={false} />
                            </div>
                            <div className="progressRow">
                                <span>.data</span>
                                <Progress percent={0} showInfo={false} />
                            </div>
                            <div className="progressRow">
                                <span>.bss</span>
                                <Progress percent={0} showInfo={false} />
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card className="pageCard riseIn" style={{ animationDelay: "220ms" }}>
                        <Typography.Title level={4}>{uiText(language, "dashTopSymbolsTitle")}</Typography.Title>
                        <Typography.Text type="secondary">
                            {uiText(language, "dashTopSymbolsHint")}
                        </Typography.Text>
                        <Divider />
                        <Table
                            columns={topSymbolColumns}
                            dataSource={[]}
                            pagination={false}
                            locale={{ emptyText: <Empty description={uiText(language, "dashTopSymbolsEmpty")} /> }}
                        />
                    </Card>
                </Col>
            </Row>
        </Space>
    );
}
