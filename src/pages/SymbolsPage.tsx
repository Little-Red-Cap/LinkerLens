import { Button, Card, Col, Input, Row, Select, Space, Table, Typography } from "antd";
import { uiText } from "../domain/uiI18n";
import { useUiStore } from "../store/ui.store";

export default function SymbolsPage() {
    const language = useUiStore((s) => s.language);
    const columns = [
        { title: uiText(language, "symbolsColumnSymbol"), dataIndex: "name", key: "name" },
        { title: uiText(language, "symbolsColumnSize"), dataIndex: "size", key: "size" },
        { title: uiText(language, "symbolsColumnType"), dataIndex: "type", key: "type" },
        { title: uiText(language, "symbolsColumnSection"), dataIndex: "section", key: "section" },
    ];

    return (
        <Space direction="vertical" size="large" className="pageStack">
            <Card className="pageCard riseIn">
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} md={10}>
                        <Input placeholder={uiText(language, "symbolsSearchPlaceholder")} allowClear />
                    </Col>
                    <Col xs={12} md={4}>
                        <Select
                            placeholder={uiText(language, "symbolsSectionPlaceholder")}
                            options={[]}
                            allowClear
                            style={{ width: "100%" }}
                        />
                    </Col>
                    <Col xs={12} md={4}>
                        <Select
                            placeholder={uiText(language, "symbolsTypePlaceholder")}
                            options={[]}
                            allowClear
                            style={{ width: "100%" }}
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <Space>
                            <Button type="primary" disabled>
                                {uiText(language, "symbolsApplyFilters")}
                            </Button>
                            <Button disabled>{uiText(language, "symbolsExport")}</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card className="pageCard riseIn" style={{ animationDelay: "120ms" }}>
                <Typography.Title level={4}>{uiText(language, "symbolsTableTitle")}</Typography.Title>
                <Typography.Text type="secondary">{uiText(language, "symbolsTableHint")}</Typography.Text>
                <Table columns={columns} dataSource={[]} pagination={{ pageSize: 20 }} />
            </Card>
        </Space>
    );
}
