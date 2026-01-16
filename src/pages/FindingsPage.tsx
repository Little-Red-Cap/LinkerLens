import { Card, Col, Row, Space, Tag, Typography } from "antd";
import { uiText } from "../domain/uiI18n";
import { useUiStore } from "../store/ui.store";

export default function FindingsPage() {
    const language = useUiStore((s) => s.language);
    const rules = [
        {
            id: "size",
            title: uiText(language, "findingsRuleSizeTitle"),
            detail: uiText(language, "findingsRuleSizeDetail"),
        },
        {
            id: "ram",
            title: uiText(language, "findingsRuleRamTitle"),
            detail: uiText(language, "findingsRuleRamDetail"),
        },
        {
            id: "float",
            title: uiText(language, "findingsRuleFloatTitle"),
            detail: uiText(language, "findingsRuleFloatDetail"),
        },
        {
            id: "exidx",
            title: uiText(language, "findingsRuleExidxTitle"),
            detail: uiText(language, "findingsRuleExidxDetail"),
        },
        {
            id: "strings",
            title: uiText(language, "findingsRuleStringsTitle"),
            detail: uiText(language, "findingsRuleStringsDetail"),
        },
    ];

    return (
        <Space direction="vertical" size="large" className="pageStack">
            <Row gutter={[16, 16]}>
                {rules.map((rule, index) => (
                    <Col xs={24} md={12} xl={8} key={rule.id}>
                        <Card className="pageCard riseIn" style={{ animationDelay: `${index * 60}ms` }}>
                            <Space direction="vertical" size="small">
                                <Tag color="default">{uiText(language, "findingsStatusNotRun")}</Tag>
                                <Typography.Title level={5}>{rule.title}</Typography.Title>
                                <Typography.Text type="secondary">{rule.detail}</Typography.Text>
                            </Space>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Space>
    );
}
