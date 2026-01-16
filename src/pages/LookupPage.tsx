import { Card, Divider, Input, Space, Typography, Tag } from "antd";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { uiText } from "../domain/uiI18n";
import { useAnalysisStore } from "../store/analysis.store";
import { useUiStore } from "../store/ui.store";

type PcLookupResult = {
    address: string;
    symbol?: {
        name: string;
        addr: string;
        size: number;
        kind: string;
        section_guess: string;
        offset: number;
    };
};

export default function LookupPage() {
    const language = useUiStore((s) => s.language);
    const analysisStatus = useAnalysisStore((s) => s.status);
    const [value, setValue] = useState("");
    const [result, setResult] = useState<PcLookupResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onSearch = async () => {
        setError(null);
        setResult(null);
        if (analysisStatus !== "success") {
            setError(uiText(language, "lookupNeedAnalysis"));
            return;
        }
        try {
            const res = await invoke<PcLookupResult>("lookup_pc", { address: value.trim() });
            setResult(res);
        } catch (err: any) {
            setError(err?.message || String(err));
        }
    };

    return (
        <Space direction="vertical" size="large" className="pageStack">
            <Card className="pageCard riseIn">
                <Typography.Title level={4}>{uiText(language, "lookupTitle")}</Typography.Title>
                <Typography.Text type="secondary">{uiText(language, "lookupHint")}</Typography.Text>
                <Divider />
                <Input.Search
                    placeholder={uiText(language, "lookupPlaceholder")}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onSearch={onSearch}
                    enterButton
                />
                {error ? (
                    <Typography.Text type="danger" className="lookupError">
                        {error}
                    </Typography.Text>
                ) : null}
                {result ? (
                    <div className="lookupResult">
                        {result.symbol ? (
                            <Space direction="vertical" size="small">
                                <Typography.Text strong>{result.symbol.name}</Typography.Text>
                                <Typography.Text type="secondary">
                                    {uiText(language, "lookupOffset")}: +0x{result.symbol.offset.toString(16)}
                                </Typography.Text>
                                <Space size="small">
                                    <Tag color="blue">{result.symbol.section_guess}</Tag>
                                    <Tag>{result.symbol.kind}</Tag>
                                    <Tag>0x{result.symbol.addr}</Tag>
                                    <Tag>{result.symbol.size} B</Tag>
                                </Space>
                            </Space>
                        ) : (
                            <Typography.Text type="secondary">{uiText(language, "lookupNotFound")}</Typography.Text>
                        )}
                    </div>
                ) : null}
            </Card>
        </Space>
    );
}
