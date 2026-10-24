import { useId, type Ref } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { xOf } from './access.ts';
import { colorOf } from './color.ts';
import { useChartContext } from './context.ts';
import { useRegistration } from './register.ts';
import type { ChartColor, ChartXInput } from './types.ts';

export interface ChartMarkerProps {
    readonly at: ChartXInput;
    /* Named in the tooltip of the bucket the moment falls in. */
    readonly label: string;
    readonly tone?: ChartColor;
    readonly className?: string;
    readonly ref?: Ref<SVGGElement>;
}

export interface ChartBandProps {
    readonly from: ChartXInput;
    readonly to: ChartXInput;
    /* Named in the tooltip of every bucket inside the range. */
    readonly label: string;
    readonly tone?: ChartColor;
    readonly className?: string;
    readonly ref?: Ref<SVGGElement>;
}

export interface ChartRuleProps {
    /* Where the line crosses the value axis. */
    readonly value: number;
    /* Written at the right end of the line with the value, such as "A · 71". */
    readonly label: string;
    readonly tone?: ChartColor;
    readonly dashed?: boolean;
    readonly className?: string;
    readonly ref?: Ref<SVGGElement>;
}

/* Room a label needs above its line before it moves under it instead. */
const RULE_LABEL = 18;

/* A horizontal line at a value across the plot, such as a reference to compare against, drawn above the series. */
export function ChartRule({ value, label, tone = 'muted', dashed = false, className, ref }: ChartRuleProps) {
    const chart = useChartContext('Chart.Rule');
    const id = useId();
    useRegistration(chart.store, 'rule', id, { value, label });
    const pixel = chart.pixelOfY(value);
    const target = chart.elements.rules;
    if (pixel === null || target === null) {
        return null;
    }
    const top = Math.round(pixel) + 0.5;
    const below = top - RULE_LABEL < 0;
    return createPortal(
        <g ref={ref} className={clsx('pointer-events-none', className)} style={{ color: colorOf(tone)! }} aria-hidden>
            <line x1={chart.plot.left} x2={chart.plot.right} y1={top} y2={top} stroke="currentColor" strokeDasharray={dashed ? '4 4' : undefined} />
            <text
                x={Math.round(chart.plot.right) - 4}
                y={Math.round(below ? top + 6 : top - 6)}
                dy={below ? '0.8em' : undefined}
                textAnchor="end"
                strokeWidth={4}
                paintOrder="stroke"
                className="fill-text text-xs font-medium tabular-nums"
                style={{ stroke: chart.halo }}
            >
                {`${label} · ${chart.formatY(value)}`}
            </text>
        </g>,
        target
    );
}

/* A dashed vertical line at a moment, with a dot on top. */
export function ChartMarker({ at, label, tone = 'muted', className, ref }: ChartMarkerProps) {
    const chart = useChartContext('Chart.Marker');
    const id = useId();
    const color = colorOf(tone)!;
    const x = xOf(at);
    useRegistration(chart.store, 'marker', id, { at: x, label, color });
    const pixel = chart.pixelOfX(x);
    if (pixel === null) {
        return null;
    }
    const left = Math.round(pixel) + 0.5;
    return (
        <g ref={ref} className={clsx('pointer-events-none', className)} style={{ color }} aria-hidden>
            <line x1={left} x2={left} y1={chart.plot.top} y2={chart.plot.bottom} stroke="currentColor" strokeDasharray="3 3" />
            <circle cx={left} cy={chart.plot.top} r={3} fill="currentColor" />
        </g>
    );
}

/* A hatched range, such as a stretch without data. */
export function ChartBand({ from, to, label, tone = 'muted', className, ref }: ChartBandProps) {
    const chart = useChartContext('Chart.Band');
    const id = useId();
    const color = colorOf(tone)!;
    const start = xOf(from);
    const end = xOf(to);
    const pattern = `chart-band-${id.replace(/[^\w-]/g, '')}`;
    useRegistration(chart.store, 'band', id, { from: start, to: end, label, color });
    const { plot, band, continuous } = chart;
    let left: number | null = null;
    let right: number | null = null;
    if (continuous !== null && typeof start === 'number' && typeof end === 'number') {
        left = Math.max(plot.left, continuous.at(Math.min(start, end)));
        right = Math.min(plot.right, continuous.at(Math.max(start, end)));
    } else if (band !== null) {
        const first = chart.xs.findIndex((key) => String(key) === String(start));
        const last = chart.xs.findIndex((key) => String(key) === String(end));
        if (first >= 0 && last >= 0) {
            left = plot.left + band.lefts[Math.min(first, last)]!;
            right = plot.left + band.lefts[Math.max(first, last)]! + band.bucket;
        }
    }
    if (left === null || right === null || right <= left) {
        return null;
    }
    const x = Math.round(left);
    return (
        <g ref={ref} className={clsx('pointer-events-none', className)} style={{ color }} aria-hidden>
            <defs>
                <pattern id={pattern} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1={0} x2={0} y1={0} y2={6} stroke="currentColor" strokeWidth={2} strokeOpacity={0.22} />
                </pattern>
            </defs>
            <rect x={x} y={plot.top} width={Math.max(1, Math.round(right) - x)} height={plot.height} fill="currentColor" fillOpacity={0.05} />
            <rect x={x} y={plot.top} width={Math.max(1, Math.round(right) - x)} height={plot.height} fill={`url(#${pattern})`} />
        </g>
    );
}
