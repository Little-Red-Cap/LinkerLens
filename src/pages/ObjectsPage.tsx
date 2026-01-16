import { Card, Col, Empty, List, Row, Space, Typography } from "antd";
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

export default function ObjectsPage() {
    const language = useUiStore((s) => s.language);
    const result = useAnalysisStore((s) => s.result);
    const objects = result?.summary.top_objects ?? [];

    return (
        <Space direction="vertical" size="large" className="pageStack">
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                    <Card className="pageCard riseIn">
                        <Typography.Title level={4}>{uiText(language, "objectsMapTitle")}</Typography.Title>
                        <Typography.Text type="secondary">{uiText(language, "objectsMapHint")}</Typography.Text>
                        <div className="placeholderPanel">
                            <Empty description={uiText(language, "objectsMapEmpty")} />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card className="pageCard riseIn" style={{ animationDelay: "120ms" }}>
                        <Typography.Title level={4}>{uiText(language, "objectsTopTitle")}</Typography.Title>
                        <Typography.Text type="secondary">{uiText(language, "objectsTopHint")}</Typography.Text>
                        {objects.length === 0 ? (
                            <Empty style={{ marginTop: 16 }} description={uiText(language, "objectsMapEmpty")} />
                        ) : (
                            <List
                                dataSource={objects}
                                renderItem={(item) => (
                                    <List.Item>
                                        <div>
                                            <Typography.Text strong>{item.name}</Typography.Text>
                                            <Typography.Text type="secondary" className="listHint">
                                                {formatBytes(item.size)}
                                            </Typography.Text>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col>
            </Row>
        </Space>
    );
}
