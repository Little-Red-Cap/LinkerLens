import { useMemo } from "react";

type TreemapItem = {
    name: string;
    value: number;
};

type Rect = TreemapItem & {
    x: number;
    y: number;
    width: number;
    height: number;
};

const palette = [
    "#2f7d6d",
    "#b26d2a",
    "#3d6a8d",
    "#7a4b64",
    "#5b7b3a",
    "#9c4a3a",
    "#2b5e8a",
    "#6a6f2c",
];

const baseName = (value: string) => {
    const normalized = value.replace(/\\/g, "/");
    const parts = normalized.split("/");
    const last = parts[parts.length - 1] || value;
    return last.length > 32 ? `${last.slice(0, 30)}…` : last;
};

const sliceLayout = (items: TreemapItem[], width: number, height: number): Rect[] => {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];
    let x = 0;
    let y = 0;
    let w = width;
    let h = height;
    let horizontal = width >= height;

    return items.map((item) => {
        const ratio = item.value / total;
        let rect: Rect;
        if (horizontal) {
            const itemWidth = w * ratio;
            rect = { ...item, x, y, width: itemWidth, height: h };
            x += itemWidth;
        } else {
            const itemHeight = h * ratio;
            rect = { ...item, x, y, width: w, height: itemHeight };
            y += itemHeight;
        }
        horizontal = !horizontal;
        return rect;
    });
};

export default function Treemap({
    items,
    width,
    height,
    onSelect,
}: {
    items: TreemapItem[];
    width: number;
    height: number;
    onSelect?: (item: TreemapItem) => void;
}) {
    const rects = useMemo(() => sliceLayout(items, width, height), [items, width, height]);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="treemapSvg">
            {rects.map((rect, index) => {
                const label = baseName(rect.name);
                const color = palette[index % palette.length];
                const showLabel = rect.width > 90 && rect.height > 28;
                return (
                    <g key={`${rect.name}-${index}`}>
                        <rect
                            x={rect.x}
                            y={rect.y}
                            width={rect.width}
                            height={rect.height}
                            fill={color}
                            opacity={0.85}
                            rx={6}
                            className={onSelect ? "treemapRect isInteractive" : "treemapRect"}
                            onClick={() => onSelect?.({ name: rect.name, value: rect.value })}
                        />
                        <title>{`${rect.name} (${rect.value})`}</title>
                        {showLabel ? (
                            <text
                                x={rect.x + 10}
                                y={rect.y + 20}
                                fill="#fff"
                                fontSize={12}
                                fontFamily="inherit"
                            >
                                {label}
                            </text>
                        ) : null}
                    </g>
                );
            })}
        </svg>
    );
}
