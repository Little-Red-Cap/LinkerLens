import { Button, Card, Col, Descriptions, Drawer, Input, Row, Select, Space, Table, Tooltip, Typography } from "antd";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { uiText } from "../domain/uiI18n";
import { useAnalysisStore } from "../store/analysis.store";
import { useUiStore } from "../store/ui.store";

const formatBytes = (value: number) => {
    if (value < 1024) return `${value} B`;
    const kb = value / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
};

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

type FacetItem = {
    value: string;
    count: number;
};

type SymbolFacets = {
    sections: FacetItem[];
    kinds: FacetItem[];
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
    const [sortKey, setSortKey] = useState<"size" | "name" | "kind" | "section_guess">("size");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [sectionFilter, setSectionFilter] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [facets, setFacets] = useState<SymbolFacets>({ sections: [], kinds: [] });
    const [facetLoading, setFacetLoading] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<SymbolInfo | null>(null);

    const columns = [
        {
            title: uiText(language, "symbolsColumnSymbol"),
            dataIndex: "name",
            key: "name",
            ellipsis: true,
            width: 360,
            sorter: true,
            sortOrder: sortKey === "name" ? (sortOrder === "asc" ? "ascend" : "descend") : undefined,
        },
        {
            title: uiText(language, "symbolsColumnSize"),
            dataIndex: "size",
            key: "size",
            width: 120,
            render: (value: number, record: SymbolInfo) => {
                if (value === 0) {
                    const kind = record.kind?.toLowerCase();
                    const noteKey = kind === "a" ? "symbolsAbsoluteNote" : "symbolsNoSizeNote";
                    return (
                        <Tooltip title={uiText(language, noteKey)}>
                            <Typography.Text type="secondary">--</Typography.Text>
                        </Tooltip>
                    );
                }
                return formatBytes(value);
            },
            sorter: true,
            sortOrder: sortKey === "size" ? (sortOrder === "asc" ? "ascend" : "descend") : undefined,
        },
        {
            title: uiText(language, "symbolsColumnType"),
            dataIndex: "kind",
            key: "type",
            width: 90,
            sorter: true,
            sortOrder: sortKey === "kind" ? (sortOrder === "asc" ? "ascend" : "descend") : undefined,
        },
        {
            title: uiText(language, "symbolsColumnSection"),
            dataIndex: "section_guess",
            key: "section",
            ellipsis: true,
            width: 140,
            sorter: true,
            sortOrder: sortKey === "section_guess" ? (sortOrder === "asc" ? "ascend" : "descend") : undefined,
        },
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
                        sort: sortKey,
                        order: sortOrder,
                        section: sectionFilter,
                        kind: typeFilter,
                    },
                });
                setData(result.items || []);
                setTotal(result.total || 0);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [analysisStatus, page, pageSize, search, sortKey, sortOrder, sectionFilter, typeFilter]);

    useEffect(() => {
        const loadFacets = async () => {
            if (analysisStatus !== "success") {
                setFacets({ sections: [], kinds: [] });
                return;
            }
            setFacetLoading(true);
            try {
                const result = await invoke<SymbolFacets>("list_symbol_facets");
                setFacets(result);
            } finally {
                setFacetLoading(false);
            }
        };
        loadFacets();
    }, [analysisStatus]);

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
                            options={facets.sections.map((item) => ({
                                label: `${item.value} (${item.count})`,
                                value: item.value,
                            }))}
                            allowClear
                            style={{ width: "100%" }}
                            loading={facetLoading}
                            value={sectionFilter ?? undefined}
                            onChange={(value) => {
                                setSectionFilter(value ?? null);
                                setPage(1);
                            }}
                        />
                    </Col>
                    <Col xs={12} md={4}>
                        <Select
                            placeholder={uiText(language, "symbolsTypePlaceholder")}
                            options={facets.kinds.map((item) => ({
                                label: `${item.value} (${item.count})`,
                                value: item.value,
                            }))}
                            allowClear
                            style={{ width: "100%" }}
                            loading={facetLoading}
                            value={typeFilter ?? undefined}
                            onChange={(value) => {
                                setTypeFilter(value ?? null);
                                setPage(1);
                            }}
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
                    tableLayout="fixed"
                    className="symbolsTable"
                    onChange={(_, __, sorter) => {
                        if (Array.isArray(sorter)) return;
                        const nextOrder = sorter.order === "ascend" ? "asc" : "desc";
                        const nextKey =
                            sorter.field === "name" || sorter.field === "size" || sorter.field === "kind"
                                ? sorter.field
                                : "section_guess";
                        setSortKey(nextKey);
                        setSortOrder(nextOrder);
                        setPage(1);
                    }}
                    onRow={(record) => ({
                        onClick: () => setSelectedSymbol(record),
                    })}
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
            <Drawer
                open={Boolean(selectedSymbol)}
                onClose={() => setSelectedSymbol(null)}
                width={420}
                title={uiText(language, "symbolsDetailTitle")}
            >
                {selectedSymbol ? (
                    <Space direction="vertical" size="small" className="pageStack">
                        <Typography.Text type="secondary">{uiText(language, "symbolsDetailHint")}</Typography.Text>
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label={uiText(language, "symbolsDetailName")}>
                                {selectedSymbol.name}
                            </Descriptions.Item>
                            <Descriptions.Item label={uiText(language, "symbolsDetailAddress")}>
                                {selectedSymbol.addr ? `0x${selectedSymbol.addr}` : "--"}
                            </Descriptions.Item>
                            <Descriptions.Item label={uiText(language, "symbolsDetailSize")}>
                                {selectedSymbol.size > 0 ? (
                                    formatBytes(selectedSymbol.size)
                                ) : (
                                    <Tooltip title={uiText(language, "symbolsNoSizeNote")}>
                                        <Typography.Text type="secondary">--</Typography.Text>
                                    </Tooltip>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label={uiText(language, "symbolsDetailType")}>
                                {selectedSymbol.kind}
                            </Descriptions.Item>
                            <Descriptions.Item label={uiText(language, "symbolsDetailSection")}>
                                {selectedSymbol.section_guess || "--"}
                            </Descriptions.Item>
                        </Descriptions>
                    </Space>
                ) : null}
            </Drawer>
        </Space>
    );
}
