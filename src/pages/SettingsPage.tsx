import { Button, Card, Col, Form, Input, Row, Select, Space, Switch, Typography } from "antd";
import { useEffect } from "react";
import { uiText } from "../domain/uiI18n";
import { useSettingsStore } from "../store/settings.store";
import { useUiStore } from "../store/ui.store";

export default function SettingsPage() {
    const [form] = Form.useForm();
    const toolchain = useSettingsStore((s) => s.toolchain);
    const updateToolchain = useSettingsStore((s) => s.updateToolchain);
    const resetToolchain = useSettingsStore((s) => s.resetToolchain);
    const themeMode = useUiStore((s) => s.theme);
    const language = useUiStore((s) => s.language);
    const setTheme = useUiStore((s) => s.setTheme);
    const setLanguage = useUiStore((s) => s.setLanguage);

    useEffect(() => {
        form.setFieldsValue(toolchain);
    }, [form, toolchain]);

    return (
        <Space direction="vertical" size="large" className="pageStack">
            <Card className="pageCard riseIn">
                <Typography.Title level={4}>{uiText(language, "settingsToolchainTitle")}</Typography.Title>
                <Typography.Text type="secondary">
                    {uiText(language, "settingsToolchainHint")}
                </Typography.Text>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={toolchain}
                    onValuesChange={(_, values) => updateToolchain(values)}
                    className="settingsForm"
                >
                    <Row gutter={[16, 12]}>
                        <Col xs={24} md={12}>
                            <Form.Item label={uiText(language, "settingsAutoDetect")} name="autoDetect" valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label={uiText(language, "settingsLastDetected")} name="lastDetected">
                                <Input readOnly placeholder="--" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={24}>
                            <Form.Item label={uiText(language, "settingsToolchainRoot")} name="toolchainRoot">
                                <Input placeholder="C:\\gcc-arm-none-eabi" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={uiText(language, "settingsNmPath")} name="nmPath">
                                <Input placeholder="Path to nm" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={uiText(language, "settingsObjdumpPath")} name="objdumpPath">
                                <Input placeholder="Path to objdump" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={uiText(language, "settingsStringsPath")} name="stringsPath">
                                <Input placeholder="Path to strings" />
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Space>
                                <Button disabled>{uiText(language, "settingsBrowse")}</Button>
                                <Button onClick={resetToolchain}>{uiText(language, "settingsReset")}</Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <Card className="pageCard riseIn" style={{ animationDelay: "120ms" }}>
                <Typography.Title level={4}>{uiText(language, "settingsUiTitle")}</Typography.Title>
                <Typography.Text type="secondary">{uiText(language, "settingsUiHint")}</Typography.Text>
                <Row gutter={[16, 12]} style={{ marginTop: 12 }}>
                    <Col xs={24} md={12}>
                        <Space>
                            <Typography.Text>{uiText(language, "theme")}</Typography.Text>
                            <Switch
                                checked={themeMode === "dark"}
                                onChange={(checked) => setTheme(checked ? "dark" : "light")}
                                checkedChildren={uiText(language, "themeDark")}
                                unCheckedChildren={uiText(language, "themeLight")}
                            />
                        </Space>
                    </Col>
                    <Col xs={24} md={12}>
                        <Space>
                            <Typography.Text>{uiText(language, "language")}</Typography.Text>
                            <Select
                                value={language}
                                onChange={(value) => setLanguage(value)}
                                options={[
                                    { value: "zh", label: "\u4e2d\u6587" },
                                    { value: "en", label: "English" },
                                ]}
                                style={{ minWidth: 120 }}
                            />
                        </Space>
                    </Col>
                </Row>
            </Card>
        </Space>
    );
}
