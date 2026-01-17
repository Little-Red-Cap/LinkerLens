import { Button, Card, Col, Form, Input, Row, Select, Space, Switch, Typography, message } from "antd";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect } from "react";
import { uiText } from "../domain/uiI18n";
import { ToolchainCandidate, deriveRootFromNm } from "../domain/toolchain";
import { useAnalysisStore } from "../store/analysis.store";
import { useSettingsStore } from "../store/settings.store";
import { useUiStore } from "../store/ui.store";

const statusLabel = (language: string, status: string) => {
    switch (status) {
        case "running":
            return uiText(language as any, "analysisStatusRunning");
        case "success":
            return uiText(language as any, "analysisStatusSuccess");
        case "error":
            return uiText(language as any, "analysisStatusError");
        default:
            return uiText(language as any, "analysisStatusIdle");
    }
};

export default function SettingsPage() {
    const [form] = Form.useForm();
    const toolchain = useSettingsStore((s) => s.toolchain);
    const updateToolchain = useSettingsStore((s) => s.updateToolchain);
    const resetToolchain = useSettingsStore((s) => s.resetToolchain);
    const analysisStatus = useAnalysisStore((s) => s.status);
    const analysisError = useAnalysisStore((s) => s.lastError);
    const themeMode = useUiStore((s) => s.theme);
    const language = useUiStore((s) => s.language);
    const setTheme = useUiStore((s) => s.setTheme);
    const setLanguage = useUiStore((s) => s.setLanguage);
    const [msgApi, contextHolder] = message.useMessage();

    useEffect(() => {
        form.setFieldsValue(toolchain);
    }, [form, toolchain]);

    const handleBrowseRoot = useCallback(async () => {
        const selected = await open({ directory: true, multiple: false });
        const root = Array.isArray(selected) ? selected[0] : selected;
        if (!root || typeof root !== "string") return;

        const separator = root.includes("\\") ? "\\" : "/";
        const cleanedRoot = root.replace(/[\\/]+$/, "");
        const binRoot = cleanedRoot.toLowerCase().endsWith(`${separator}bin`)
            ? cleanedRoot
            : `${cleanedRoot}${separator}bin`;
        const isWindows = /^[a-zA-Z]:\\/.test(cleanedRoot);
        const exe = isWindows ? ".exe" : "";

        updateToolchain({
            toolchainRoot: cleanedRoot,
            nmPath: toolchain.nmPath || `${binRoot}${separator}arm-none-eabi-nm${exe}`,
            objdumpPath: toolchain.objdumpPath || `${binRoot}${separator}arm-none-eabi-objdump${exe}`,
            stringsPath: toolchain.stringsPath || `${binRoot}${separator}arm-none-eabi-strings${exe}`,
        });
    }, [toolchain.nmPath, toolchain.objdumpPath, toolchain.stringsPath, updateToolchain]);

    const detectToolchain = useCallback(async () => {
        try {
            const candidates = await invoke<ToolchainCandidate[]>("detect_toolchain", {
                config: {
                    auto_detect: toolchain.autoDetect,
                    toolchain_root: toolchain.toolchainRoot || null,
                    nm_path: toolchain.nmPath || null,
                    objdump_path: toolchain.objdumpPath || null,
                    strings_path: toolchain.stringsPath || null,
                },
            });
            if (!candidates || candidates.length === 0) {
                msgApi.warning(uiText(language, "toolchainDetectFailed"));
                return;
            }
            const candidate = candidates[0];
            const derivedRoot = deriveRootFromNm(candidate.paths.nm_path);
            updateToolchain({
                toolchainRoot: derivedRoot || toolchain.toolchainRoot,
                nmPath: candidate.paths.nm_path,
                objdumpPath: candidate.paths.objdump_path,
                stringsPath: candidate.paths.strings_path,
                lastDetected: candidate.source,
            });
            msgApi.success(uiText(language, "toolchainDetectSuccess"));
        } catch (error: unknown) {
            const messageText = error instanceof Error ? error.message : String(error);
            msgApi.error(messageText);
        }
    }, [language, msgApi, toolchain, updateToolchain]);

    return (
        <Space direction="vertical" size="large" className="pageStack">
            {contextHolder}
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
                            <Form.Item
                                label={uiText(language, "settingsAutoDetect")}
                                name="autoDetect"
                                valuePropName="checked"
                            >
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
                                <Button onClick={handleBrowseRoot}>{uiText(language, "settingsBrowse")}</Button>
                                <Button onClick={detectToolchain}>{uiText(language, "settingsDetect")}</Button>
                                <Button onClick={resetToolchain}>{uiText(language, "settingsReset")}</Button>
                            </Space>
                        </Col>
                        <Col xs={24}>
                            <Typography.Text type="secondary">
                                {uiText(language, "analysisStatusDetail", { status: statusLabel(language, analysisStatus) })}
                            </Typography.Text>
                            {analysisStatus === "error" && analysisError ? (
                                <Typography.Text className="errorText">{analysisError}</Typography.Text>
                            ) : null}
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
