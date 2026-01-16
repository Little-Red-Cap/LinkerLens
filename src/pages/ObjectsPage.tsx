import { Card, Col, Empty, List, Row, Space, Typography } from "antd";
import { uiText } from "../domain/uiI18n";
import { useUiStore } from "../store/ui.store";

export default function ObjectsPage() {
    const language = useUiStore((s) => s.language);
    const mockItems = [
        { title: "libcore.a", detail: uiText(language, "objectsZeroSymbols") },
        { title: "libdrivers.a", detail: uiText(language, "objectsZeroSymbols") },
        { title: "app.o", detail: uiText(language, "objectsZeroSymbols") },
    ];

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
                        <List
                            dataSource={mockItems}
                            renderItem={(item) => (
                                <List.Item>
                                    <div>
                                        <Typography.Text strong>{item.title}</Typography.Text>
                                        <Typography.Text type="secondary" className="listHint">
                                            {item.detail}
                                        </Typography.Text>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </Space>
    );
}
