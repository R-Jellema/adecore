import { useRef, useSyncExternalStore, type ReactNode, type Ref } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { formatRounded } from '@adecore/ui/format';
import { useChartContext } from './context.ts';
import { decimalsOf, tickCount } from './scale.ts';
import { useBeforePaint } from './register.ts';
import type { AxisSizes, ChartStore } from './store.ts';
import { formatTime, timeLabelOf } from './time-format.ts';
import type { ChartX } from './types.ts';

export interface ChartGridProps {
    readonly axis?: 'y' | 'x' | 'both';
    readonly className?: string;
    readonly ref?: Ref<SVGGElement>;
}

export interface ChartXAxisProps {
    /* Writes a bucket's x, here and in the tooltip, the live region and the table. */
    readonly format?: (x: ChartX) => string;
    /* A target count of ticks on a continuous scale; the axis drops ticks whose labels would not fit. */
    readonly ticks?: number;
    /* Slants the labels, for long names under every column of a ranked row. */
    readonly angle?: 0 | -40;
    readonly className?: string;
    readonly ref?: Ref<SVGGElement>;
}

export interface ChartYAxisProps {
    /* Writes a value, here and in the tooltip, the live region and the table. */
    readonly format?: (value: number) => string;
    /* A target count of ticks. */
    readonly ticks?: number;
    readonly side?: 'left' | 'right';
    readonly className?: string;
    readonly ref?: Ref<SVGGElement>;
}

export interface ChartBucketGroup<Row> {
    readonly key: string;
    readonly rows: readonly Row[];
    /* The index of the group's first and last bucket. */
    readonly first: number;
    readonly last: number;
}

export interface ChartGroupAxisProps<Row> {
    readonly children: (group: ChartBucketGroup<Row>) => ReactNode;
    readonly className?: string;
    readonly ref?: Ref<HTMLDivElement>;
}

/* Between the end of a label and the plot, and between two labels on the x axis. */
const LABEL_GAP = 8;
/* Labels of a category sit under their own column, so they need less air between them than round ticks do. */
const BAND_LABEL_GAP = 4;
const X_LABEL_LINE = 16;
const X_TICK_SPACING = 96;
/* What a label is taken to measure before it has been drawn once. */
const GUESS = 48;
const SLANT = (40 * Math.PI) / 180;

const textWidth = (node: SVGTextElement): number =>
    typeof node.getComputedTextLength === 'function' ? node.getComputedTextLength() : (node.textContent?.length ?? 0) * 7;

const widestIn = (group: SVGGElement | null): number => Math.max(0, ...[...(group?.querySelectorAll('text') ?? [])].map(textWidth));

/* A line sits on the middle of a pixel, so one pixel wide stays one pixel wide. */
const crisp = (pixel: number): number => Math.round(pixel) + 0.5;

/* Gridlines on the ticks, a heavier one on the ground. */
export function ChartGrid({ axis = 'y', className, ref }: ChartGridProps) {
    const chart = useChartContext('Chart.Grid');
    const { plot, y, continuous, band } = chart;
    const ground = y.domain[0] <= 0 && y.domain[1] >= 0 ? 0 : y.domain[0];
    const columns =
        continuous !== null
            ? continuous.ticks(tickCount(plot.width, X_TICK_SPACING)).map((tick) => continuous.at(tick))
            : chart.xs.map((_, index) => chart.centerOf(index));
    return (
        <g ref={ref} className={clsx('pointer-events-none', className)} aria-hidden>
            {axis !== 'x' &&
                y.ticks.map((tick) => {
                    const pixel = y.at(tick);
                    return pixel === null ? null : (
                        <line
                            key={tick}
                            x1={plot.left}
                            x2={plot.right}
                            y1={crisp(pixel)}
                            y2={crisp(pixel)}
                            className={tick === ground ? 'stroke-border' : 'stroke-border-soft'}
                        />
                    );
                })}
            {axis !== 'y' &&
                (band === null || chart.xs.length > 0) &&
                columns.map((pixel) => <line key={pixel} x1={crisp(pixel)} x2={crisp(pixel)} y1={plot.top} y2={plot.bottom} className="stroke-border-soft" />)}
        </g>
    );
}

/* The labels under the plot: one per bucket on a band scale as far as they fit, round ticks on a continuous one. */
export function ChartXAxis({ format, ticks, angle = 0, className, ref }: ChartXAxisProps) {
    const chart = useChartContext('Chart.XAxis');
    const { store, plot, continuous, band, xs } = chart;
    const labels = useRef<SVGGElement>(null);
    const widest = useStoreAxis(chart.store, 'xLabel') ?? GUESS;
    const room = Math.ceil(angle === 0 ? X_LABEL_LINE : widest * Math.sin(SLANT) + X_LABEL_LINE * Math.cos(SLANT));
    const baseline = plot.bottom + LABEL_GAP;

    useBeforePaint(() => {
        store.setAxis('xLabel', Math.ceil(widestIn(labels.current)));
        store.setAxis('x', room + LABEL_GAP + 4);
        store.setFormat('x', format);
    });
    useBeforePaint(
        () => () => {
            store.setAxis('x', null);
            store.setAxis('xLabel', null);
            store.setFormat('x', undefined);
        },
        [store]
    );

    let placed: { key: string; x: number; text: string }[];
    if (continuous !== null) {
        const values = continuous.ticks(ticks ?? tickCount(plot.width, widest + 3 * LABEL_GAP));
        const step = values.length > 1 ? values[1]! - values[0]! : continuous.domain[1] - continuous.domain[0];
        const label = timeLabelOf(continuous.domain[1] - continuous.domain[0], step);
        const decimals = decimalsOf(step);
        placed = values
            .map((tick) => ({
                key: String(tick),
                x: continuous.at(tick),
                text: format !== undefined ? format(tick) : chart.xScale === 'time' ? formatTime(tick, label) : formatRounded(tick, decimals)
            }))
            // A label that would hang past the end of the chart is left out rather than moved off its tick.
            .filter((tick) => tick.x - widest / 2 >= -chart.leftAxis && tick.x + widest / 2 <= chart.width + 1);
    } else if (band !== null && band.bucket > 0) {
        const every = Math.max(1, Math.ceil((angle === 0 ? widest + BAND_LABEL_GAP : X_LABEL_LINE) / band.bucket));
        placed = xs.flatMap((key, index) => {
            if (index % every !== 0) {
                return [];
            }
            const center = chart.centerOf(index);
            const x = angle === 0 ? Math.min(Math.max(center, widest / 2 - chart.leftAxis), chart.width - widest / 2) : center;
            return [{ key: String(key), x, text: chart.formatX(key) }];
        });
    } else {
        placed = [];
    }

    return (
        <g ref={ref} className={clsx('pointer-events-none', className)} aria-hidden>
            <g ref={labels}>
                {placed.map((tick) =>
                    angle === 0 ? (
                        <text
                            key={tick.key}
                            x={Math.round(tick.x)}
                            y={baseline}
                            dy="0.8em"
                            textAnchor="middle"
                            className="fill-text-faint text-xs tabular-nums"
                        >
                            {tick.text}
                        </text>
                    ) : (
                        <text
                            key={tick.key}
                            transform={`translate(${Math.round(tick.x) + 4},${baseline}) rotate(${angle})`}
                            dy="0.8em"
                            textAnchor="end"
                            className="fill-text-muted text-xs"
                        >
                            {tick.text}
                        </text>
                    )
                )}
            </g>
        </g>
    );
}

/* The value labels beside the plot. It measures its widest label and gives the plot the rest. */
export function ChartYAxis({ format, ticks, side = 'left', className, ref }: ChartYAxisProps) {
    const chart = useChartContext('Chart.YAxis');
    const { store, y, yStep } = chart;
    const labels = useRef<SVGGElement>(null);
    const target = side === 'left' ? chart.elements.left : chart.elements.right;

    useBeforePaint(() => {
        if (labels.current !== null) {
            store.setAxis(side, Math.ceil(widestIn(labels.current)) + LABEL_GAP);
        }
        store.setAxis('yTicks', ticks ?? null);
        store.setFormat('y', format);
    });
    useBeforePaint(
        () => () => {
            store.setAxis(side, null);
            store.setAxis('yTicks', null);
            store.setFormat('y', undefined);
        },
        [store, side]
    );

    if (target === null) {
        return null;
    }
    const decimals = decimalsOf(yStep);
    return createPortal(
        <g ref={ref} className={className}>
            <g ref={labels}>
                {y.ticks.map((tick) => {
                    const pixel = y.at(tick);
                    return pixel === null ? null : (
                        <text
                            key={tick}
                            x={side === 'left' ? chart.leftAxis - LABEL_GAP : LABEL_GAP}
                            y={Math.round(pixel)}
                            dy="0.32em"
                            textAnchor={side === 'left' ? 'end' : 'start'}
                            className="fill-text-faint text-xs tabular-nums"
                        >
                            {format !== undefined ? format(tick) : formatRounded(tick, decimals)}
                        </text>
                    );
                })}
            </g>
        </g>,
        target
    );
}

/* A second row of labels under the x axis, one per group and centered under it. HTML, so a mark or a logo fits. */
export function ChartGroupAxis<Row>({ children, className, ref }: ChartGroupAxisProps<Row>) {
    const chart = useChartContext('Chart.GroupAxis');
    const target = chart.elements.groups;
    if (target === null || chart.band === null) {
        return null;
    }
    const rows = chart.data as Row[];
    return createPortal(
        <div ref={ref} aria-hidden className={clsx('grid pt-1 text-xs', className)}>
            {chart.band.groups.map((run) => (
                <div
                    key={`${run.key}:${run.first}`}
                    className="col-start-1 row-start-1 flex min-w-0 flex-col items-center gap-1 px-1 text-center"
                    style={{ marginLeft: Math.round(chart.plot.left + run.left), width: Math.round(run.right - run.left) }}
                >
                    {children({ key: run.key, rows: rows.slice(run.first, run.last + 1), first: run.first, last: run.last })}
                </div>
            ))}
        </div>,
        target
    );
}

function useStoreAxis(store: ChartStore, axis: keyof AxisSizes): number | null {
    return useSyncExternalStore(
        store.subscribe,
        () => store.axes()[axis],
        () => store.axes()[axis]
    );
}
