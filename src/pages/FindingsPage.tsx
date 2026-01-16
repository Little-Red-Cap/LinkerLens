import { Card, Col, Row, Space, Tag, Typography } from "antd";
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

type RuleConfig = {
    id: string;
    titleKey: Parameters<typeof uiText>[1];
    detailKey: Parameters<typeof uiText>[1];
    valueKind: "bytes" | "count";
};

const rules: RuleConfig[] = [
    { id: "RAM_PRESSURE", titleKey: "findingsRuleRamTitle", detailKey: "findingsRuleRamDetail", valueKind: "bytes" },
    { id: "FLOAT_BLOAT", titleKey: "findingsRuleFloatTitle", detailKey: "findingsRuleFloatDetail", valueKind: "bytes" },
    { id: "EXIDX", titleKey: "findingsRuleExidxTitle", detailKey: "findingsRuleExidxDetail", valueKind: "bytes" },
    { id: "STRING_COUNT", titleKey: "findingsRuleStringsTitle", detailKey: "findingsRuleStringsDetail", valueKind: "count" },
];

const severityLabel = (language: string, severity: string) => {
    if (severity === "warn") return uiText(language as any, "findingsSeverityWarn");
    return uiText(language as any, "findingsSeverityInfo");
};

const severityColor = (severity: string) => (severity === "warn" ? "orange" : "blue");

export default function FindingsPage() {
    const language = useUiStore((s) => s.language);
    const result = useAnalysisStore((s) => s.result);
    const findings = result?.summary.findings ?? [];
    const findingsById = new Map(findings.map((item) => [item.id, item]));

    return (
        <Space direction="vertical" size="large" className="pageStack">
            <Row gutter={[16, 16]}>
                {rules.map((rule, index) => {
                    const finding = findingsById.get(rule.id);
                    const hasResult = Boolean(result);
                    const statusLabel = finding
                        ? severityLabel(language, finding.severity)
                        : hasResult
                            ? uiText(language, "findingsStatusClear")
                            : uiText(language, "findingsStatusNotRun");
                    const statusColor = finding ? severityColor(finding.severity) : "default";
                    const valueLabel = rule.valueKind === "bytes"
                        ? formatBytes(finding?.value)
                        : finding
                            ? String(finding.value)
                            : "--";
                    return (
                        <Col xs={24} md={12} xl={8} key={rule.id}>
                            <Card className="pageCard riseIn" style={{ animationDelay: `${index * 60}ms` }}>
                                <Space direction="vertical" size="small" className="findingCard">
                                    <Tag color={statusColor}>{statusLabel}</Tag>
                                    <Typography.Title level={5}>{uiText(language, rule.titleKey)}</Typography.Title>
                                    <Typography.Text type="secondary">{uiText(language, rule.detailKey)}</Typography.Text>
                                    <div className="findingValue">
                                        <Typography.Text type="secondary">
                                            {rule.valueKind === "count"
                                                ? uiText(language, "findingsCount")
                                                : uiText(language, "findingsValue")}
                                        </Typography.Text>
                                        <Typography.Text strong>{valueLabel}</Typography.Text>
                                    </div>
                                    {finding?.items?.length ? (
                                        <div className="findingItems">
                                            <Typography.Text type="secondary">{uiText(language, "findingsItems")}</Typography.Text>
                                            <Typography.Text>{finding.items.slice(0, 5).join(", ")}</Typography.Text>
                                        </div>
                                    ) : null}
                                </Space>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </Space>
    );
}
