import { Card, Col, Empty, List, Row, Space, Tabs, Typography } from "antd";
import Treemap from "../components/Treemap";
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

type Contribution = {
    name: string;
    size: number;
};

const renderList = (items: Contribution[], emptyLabel: string) => {
    if (items.length === 0) {
        return <Empty style={{ marginTop: 16 }} description={emptyLabel} />;
    }
    return (
        <List
            dataSource={items}
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
    );
};

export default function ObjectsPage() {
    const language = useUiStore((s) => s.language);
    const result = useAnalysisStore((s) => s.result);
    const objects = result?.summary.top_objects ?? [];
    const libraries = result?.summary.top_libraries ?? [];
    const sections = result?.summary.top_sections ?? [];
    const treemapItems = objects.map((item) => ({ name: item.name, value: item.size }));

    return (
        <Space direction="vertical" size="large" className="pageStack">
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                    <Card className="pageCard riseIn">
                        <Typography.Title level={4}>{uiText(language, "objectsMapTitle")}</Typography.Title>
                        <Typography.Text type="secondary">{uiText(language, "objectsMapHint")}</Typography.Text>
                        <div className="treemapWrap">
                            {treemapItems.length === 0 ? (
                                <Empty description={uiText(language, "objectsMapEmpty")} />
                            ) : (
                                <Treemap items={treemapItems} width={640} height={360} />
                            )}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card className="pageCard riseIn" style={{ animationDelay: "120ms" }}>
                        <Tabs
                            size="small"
                            items={[
                                {
                                    key: "objects",
                                    label: uiText(language, "objectsTopTitle"),
                                    children: (
                                        <>
                                            <Typography.Text type="secondary">
                                                {uiText(language, "objectsTopHint")}
                                            </Typography.Text>
                                            {renderList(objects, uiText(language, "objectsTopEmpty"))}
                                        </>
                                    ),
                                },
                                {
                                    key: "libraries",
                                    label: uiText(language, "objectsLibrariesTitle"),
                                    children: (
                                        <>
                                            <Typography.Text type="secondary">
                                                {uiText(language, "objectsLibrariesHint")}
                                            </Typography.Text>
                                            {renderList(libraries, uiText(language, "objectsTopEmpty"))}
                                        </>
                                    ),
                                },
                                {
                                    key: "sections",
                                    label: uiText(language, "objectsSectionsTitle"),
                                    children: (
                                        <>
                                            <Typography.Text type="secondary">
                                                {uiText(language, "objectsSectionsHint")}
                                            </Typography.Text>
                                            {renderList(sections, uiText(language, "objectsTopEmpty"))}
                                        </>
                                    ),
                                },
                            ]}
                        />
                    </Card>
                </Col>
            </Row>
        </Space>
    );
}
