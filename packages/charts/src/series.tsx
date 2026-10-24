import { useContext, useId, type ReactNode, type Ref } from 'react';
import clsx from 'clsx';
import { area, curveLinear, curveMonotoneX, curveStepAfter, line } from 'd3-shape';
import { numberOf, readValue } from './access.ts';
import { columnsIn, segmentOf } from './band.ts';
import { colorOf, seriesColor } from './color.ts';
import { BarsContext, useChartContext, type ChartContextValue } from './context.ts';
import { useKeyCheck, useRegistration } from './register.ts';
import type { ChartAccessor, ChartColor, ChartCurve } from './types.ts';

export interface ChartLineProps<Row> {
    readonly value: ChartAccessor<Row, number | null | undefined>;
    /* The name of the series in the tooltip, the legend and the table. */
    readonly label: string;
    readonly tone?: ChartColor;
    readonly curve?: ChartCurve;
    readonly dashed?: boolean;
    /* A dot on every value. Without it only a value with no neighbor gets one, so it does not vanish. */
    readonly dots?: boolean;
    readonly className?: string;
    readonly ref?: Ref<SVGGElement>;
}

export interface ChartAreaProps<Row> extends ChartLineProps<Row> {
    /* Piles the area on the stacked areas before it instead of on zero. */
    readonly stack?: boolean;
}

/* A tone, a color of the app's own, or either per row: `(row) => runTone(row.status)`. */
export type ChartBarTone<Row> = ChartColor | ((row: Row, index: number) => ChartColor);

export interface ChartBarProps<Row> {
    readonly value: ChartAccessor<Row, number | null | undefined>;
    readonly label: string;
    readonly tone?: ChartBarTone<Row>;
    /* The opacity of a column by its place in its group, for columns that grow stronger inside one. */
    readonly opacity?: (row: Row, indexInGroup: number) => number;
    readonly className?: string;
    readonly ref?: Ref<SVGGElement>;
}

export interface ChartBarsProps {
    /* Piles the columns of a bucket on each other instead of standing them side by side. */
    readonly stack?: boolean;
    readonly children?: ReactNode;
    readonly className?: string;
    readonly ref?: Ref<SVGGElement>;
}

const CURVES = { linear: curveLinear, monotone: curveMonotoneX, step: curveStepAfter };

/* Columns outside the bucket under the cursor still read as their own color at this. */
const HOVER_DIM = 0.55;
const OUT_OF_FOCUS = 0.4;

type Point = readonly [number, number] | null;

const pointsOf = (chart: ChartContextValue, values: readonly (number | null)[]): Point[] =>
    values.map((value, index) => {
        const pixel = value === null ? null : chart.pixelOfY(value);
        return pixel === null ? null : [chart.centerOf(index), pixel];
    });

/* A value between two gaps is no line at all, so it gets a dot of its own. */
const lonePoints = (points: readonly Point[]): [number, number][] =>
    points.flatMap((point, index) =>
        point !== null && points[index - 1] == null && points[index + 1] == null ? [[point[0], point[1]] as [number, number]] : []
    );

function useSeriesValues<Row>(part: string, value: ChartAccessor<Row, number | null | undefined>): [ChartContextValue, string, (number | null)[]] {
    const chart = useChartContext(part);
    const id = useId();
    useKeyCheck(value, chart.data, part);
    return [chart, id, (chart.data as Row[]).map((row, index) => numberOf(readValue(value, row, index)))];
}

function LinePath({ points, curve, dashed, dots }: { points: readonly Point[]; curve: ChartCurve; dashed: boolean; dots: boolean }) {
    const path = line<Point>()
        .defined((point) => point !== null)
        .x((point) => point![0])
        .y((point) => point![1])
        .curve(CURVES[curve])(points);
    const marked = dots ? points.filter((point): point is [number, number] => point !== null) : lonePoints(points);
    return (
        <>
            {path !== null && (
                <path
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={dashed ? '4 4' : undefined}
                />
            )}
            {marked.map(([x, y]) => (
                <circle key={x} cx={x} cy={y} r={2.5} fill="currentColor" />
            ))}
        </>
    );
}

/* A line through the values. A missing value breaks it. */
export function ChartLine<Row>({ value, label, tone, curve = 'linear', dashed = false, dots = false, className, ref }: ChartLineProps<Row>) {
    const [chart, id, values] = useSeriesValues('Chart.Line', value);
    useRegistration(chart.store, 'series', id, { kind: 'line', label, color: colorOf(tone), rowColors: null, values, stack: null, bars: null, curve });
    return (
        <g ref={ref} className={clsx('pointer-events-none', className)} style={{ color: chart.colors.get(id) ?? colorOf(tone) ?? seriesColor(0) }}>
            <LinePath points={pointsOf(chart, values)} curve={curve} dashed={dashed} dots={dots} />
        </g>
    );
}

/* A line with its area filled down to zero, or down to the stacked areas before it. */
export function ChartArea<Row>({ value, label, tone, curve = 'linear', dashed = false, dots = false, stack = false, className, ref }: ChartAreaProps<Row>) {
    const [chart, id, values] = useSeriesValues('Chart.Area', value);
    const gradient = `chart-area-${id.replace(/[^\w-]/g, '')}`;
    useRegistration(chart.store, 'series', id, {
        kind: 'area',
        label,
        color: colorOf(tone),
        rowColors: null,
        values,
        stack: stack ? 'area' : null,
        bars: null,
        curve
    });
    const stacked = chart.stacked.get(id);
    const tops = pointsOf(chart, stacked?.top ?? values);
    const ground = chart.pixelOfY(Math.max(chart.y.domain[0], 0)) ?? chart.plot.bottom;
    const fill = area<number>()
        .defined((index) => tops[index] !== null)
        .x((index) => tops[index]![0])
        .y1((index) => tops[index]![1])
        .y0((index) => (stacked === undefined ? ground : (chart.pixelOfY(stacked.base[index]!) ?? ground)))
        .curve(CURVES[curve])(tops.map((_, index) => index));
    return (
        <g ref={ref} className={clsx('pointer-events-none', className)} style={{ color: chart.colors.get(id) ?? colorOf(tone) ?? seriesColor(0) }}>
            {stack ? null : (
                <defs>
                    <linearGradient id={gradient} x1={0} x2={0} y1={0} y2={1}>
                        <stop offset="0%" stopColor="currentColor" stopOpacity={0.24} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                    </linearGradient>
                </defs>
            )}
            {fill !== null && <path d={fill} fill={stack ? 'currentColor' : `url(#${gradient})`} fillOpacity={stack ? 0.32 : 1} />}
            <LinePath points={tops} curve={curve} dashed={dashed} dots={dots} />
        </g>
    );
}

/* A group of `Chart.Bar` that shares the width of a bucket, side by side or stacked. */
export function ChartBars({ stack = false, children, className, ref }: ChartBarsProps) {
    const id = useId();
    return (
        <BarsContext value={{ id, stack }}>
            <g ref={ref} className={className}>
                {children}
            </g>
        </BarsContext>
    );
}

/* Columns, one per bucket. Only on a `band` scale. */
export function ChartBar<Row>({ value, label, tone, opacity, className, ref }: ChartBarProps<Row>) {
    const [chart, id, values] = useSeriesValues('Chart.Bar', value);
    const bars = useContext(BarsContext);
    const rows = chart.data as Row[];
    const rowColors = typeof tone === 'function' ? rows.map((row, index) => colorOf(tone(row, index))!) : null;
    const color = typeof tone === 'function' ? (rowColors?.[0] ?? null) : colorOf(tone);
    useRegistration(chart.store, 'series', id, {
        kind: 'bar',
        label,
        color,
        rowColors,
        values,
        stack: bars?.stack === true ? bars.id : null,
        bars: bars?.id ?? null,
        curve: 'linear'
    });
    const layout = chart.band;
    if (layout === null) {
        return null;
    }
    const { slot, count } = chart.slots.get(id) ?? { slot: 0, count: 1 };
    const stacked = chart.stacked.get(id);
    const fallback = chart.colors.get(id) ?? seriesColor(0);
    const anySelected = chart.selected.some(Boolean);
    const firstOfGroup = (index: number): number => layout.groups.find((run) => index >= run.first && index <= run.last)?.first ?? 0;
    return (
        <g ref={ref} className={clsx('pointer-events-none', className)}>
            {values.map((amount, index) => {
                const top = stacked?.top[index];
                const base = stacked?.base[index] ?? 0;
                const topPixel = top === null || top === undefined ? null : chart.pixelOfY(top);
                const basePixel = chart.pixelOfY(base) ?? chart.plot.bottom;
                if (amount === null || topPixel === null) {
                    return null;
                }
                const column = columnsIn(chart.plot.left + layout.lefts[index]!, layout.bucket, count)[slot]!;
                const { y, height } = segmentOf(topPixel, basePixel, base === 0, amount);
                const focused = index === chart.activeIndex || chart.selected[index] === true;
                let alpha = focused ? 1 : (opacity?.(rows[index]!, index - firstOfGroup(index)) ?? 1);
                if (chart.dimmed[index] === true || (anySelected && !focused)) {
                    alpha *= OUT_OF_FOCUS;
                } else if (chart.activeIndex >= 0 && !focused) {
                    alpha *= HOVER_DIM;
                }
                return (
                    <rect
                        key={index}
                        x={column.x}
                        y={y}
                        width={column.width}
                        height={height}
                        rx={stacked !== undefined && bars?.stack === true ? 0 : Math.min(2, Math.floor(column.width / 4))}
                        opacity={alpha}
                        style={{ fill: rowColors?.[index] ?? color ?? fallback }}
                    />
                );
            })}
        </g>
    );
}
