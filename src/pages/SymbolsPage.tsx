import { Button, Card, Col, Input, Row, Select, Space, Table, Typography } from "antd";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { uiText } from "../domain/uiI18n";
import { useAnalysisStore } from "../store/analysis.store";
import { useUiStore } from "../store/ui.store";

type SymbolInfo = {
    name: string;
    size: number;
    addr?: string;
    kind: string;
    section_guess?: string;
};

type PagedSymbols = {
    total: number;
    items: SymbolInfo[];
};

export default function SymbolsPage() {
    const language = useUiStore((s) => s.language);
    const analysisStatus = useAnalysisStore((s) => s.status);
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState("");
    const [data, setData] = useState<SymbolInfo[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [loading, setLoading] = useState(false);

    const columns = [
        { title: uiText(language, "symbolsColumnSymbol"), dataIndex: "name", key: "name" },
        { title: uiText(language, "symbolsColumnSize"), dataIndex: "size", key: "size" },
        { title: uiText(language, "symbolsColumnType"), dataIndex: "kind", key: "type" },
        { title: uiText(language, "symbolsColumnSection"), dataIndex: "section_guess", key: "section" },
    ];

    useEffect(() => {
        const load = async () => {
            if (analysisStatus !== "success") {
                setData([]);
                setTotal(0);
                return;
            }
            setLoading(true);
            try {
                const result = await invoke<PagedSymbols>("list_symbols", {
                    query: {
                        query: search || null,
                        page,
                        page_size: pageSize,
                        sort: "size",
                        order: "desc",
                    },
                });
                setData(result.items || []);
                setTotal(result.total || 0);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [analysisStatus, page, pageSize, search]);

    const onSearch = () => {
        setPage(1);
        setSearch(query.trim());
    };

    return (
        <Space direction="vertical" size="large" className="pageStack">
            <Card className="pageCard riseIn">
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} md={10}>
                        <Input.Search
                            placeholder={uiText(language, "symbolsSearchPlaceholder")}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onSearch={onSearch}
                            allowClear
                        />
                    </Col>
                    <Col xs={12} md={4}>
                        <Select
                            placeholder={uiText(language, "symbolsSectionPlaceholder")}
                            options={[]}
                            allowClear
                            style={{ width: "100%" }}
                            disabled
                        />
                    </Col>
                    <Col xs={12} md={4}>
                        <Select
                            placeholder={uiText(language, "symbolsTypePlaceholder")}
                            options={[]}
                            allowClear
                            style={{ width: "100%" }}
                            disabled
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <Space>
                            <Button type="primary" onClick={onSearch}>
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
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey={(row) => `${row.name}-${row.addr ?? ""}`}
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        onChange: (nextPage, nextSize) => {
                            setPage(nextPage);
                            if (nextSize && nextSize !== pageSize) {
                                setPageSize(nextSize);
                                setPage(1);
                            }
                        },
                    }}
                />
            </Card>
        </Space>
    );
}
