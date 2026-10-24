import { useId, useState, type ReactNode, type Ref } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Button, Surface } from '@adecore/ui';
import { useChartContext, type ChartContextValue } from './context.ts';
import type { ChartX } from './types.ts';

export interface ChartBucketValue {
    readonly label: string;
    readonly color: string;
    readonly value: number;
}

/* The bucket under the cursor, as `Chart.Tooltip` hands it to its children. */
export interface ChartBucket<Row> {
    readonly index: number;
    readonly x: ChartX;
    readonly row: Row;
    readonly group: string | null;
    readonly values: readonly ChartBucketValue[];
    /* The markers and bands of the bucket. */
    readonly notes: readonly string[];
}

export interface ChartTooltipProps<Row> {
    /* A line with the sum of the values under the series. */
    readonly total?: boolean;
    /* Writes the values of the card; without it they are written as the y axis writes them. */
    readonly format?: (value: number) => string;
    /* What the card holds in place of its rows. */
    readonly children?: (bucket: ChartBucket<Row>) => ReactNode;
    readonly className?: string;
    readonly ref?: Ref<HTMLDivElement>;
}

export interface ChartLegendProps {
    readonly className?: string;
    readonly ref?: Ref<HTMLUListElement>;
}

export interface ChartTableProps {
    readonly className?: string;
    readonly ref?: Ref<HTMLDivElement>;
}

/* Between the cursor and the card, and the least room the card keeps to the edge of the chart. */
const OFFSET = 12;
const EDGE = 4;

const bucketOf = <Row,>(chart: ChartContextValue, index: number): ChartBucket<Row> => ({
    index,
    x: chart.xs[index]!,
    row: chart.data[index] as Row,
    group: chart.groupKeys?.[index] ?? null,
    values: [...chart.series].flatMap(([id, entry]) => {
        const value = entry.values[index];
        return value === null || value === undefined ? [] : [{ label: entry.label, color: entry.rowColors?.[index] ?? chart.colors.get(id)!, value }];
    }),
    notes: chart.notesAt(index)
});

/* The swatch of a series: a dash for a line, a square for a column. */
function Swatch({ color, kind }: { color: string; kind: 'line' | 'area' | 'bar' }) {
    return <span className={clsx('shrink-0', kind === 'bar' ? 'size-2 rounded-xs' : 'h-0.5 w-3 rounded-full')} style={{ background: color }} />;
}

/* The card at the cursor: the x of the bucket, a row per series, then its markers and bands. */
export function ChartTooltip<Row>({ total = false, format, children, className, ref }: ChartTooltipProps<Row>) {
    const chart = useChartContext('Chart.Tooltip');
    const { t } = useTranslation('charts');
    const { activeIndex, elements } = chart;
    if (activeIndex < 0 || elements.tooltip === null) {
        return null;
    }
    const bucket = bucketOf<Row>(chart, activeIndex);
    const write = format ?? chart.formatY;
    const pixel = chart.leftAxis + chart.centerOf(activeIndex) - chart.scroll;
    // The card hangs on the side with the most room, so it never covers the cursor and never runs off.
    const right = pixel > chart.box / 2;
    const place = right
        ? { right: Math.round(chart.box - pixel + OFFSET), maxWidth: Math.max(0, Math.round(pixel - OFFSET - EDGE)) }
        : { left: Math.round(pixel + OFFSET), maxWidth: Math.max(0, Math.round(chart.box - pixel - OFFSET - EDGE)) };
    const sum = bucket.values.reduce((all, entry) => all + entry.value, 0);
    return createPortal(
        <Surface
            ref={ref}
            aria-hidden
            className={clsx('absolute flex w-max min-w-36 flex-col gap-1 rounded-lg px-2.5 py-2 text-xs', className)}
            style={{ top: chart.plot.top, ...place }}
        >
            {children !== undefined ? (
                children(bucket)
            ) : (
                <>
                    <p className="font-medium text-text">{[bucket.group, chart.formatX(bucket.x)].filter(Boolean).join(' · ')}</p>
                    {[...chart.series].map(([id, entry]) => {
                        const value = entry.values[activeIndex];
                        return value === null || value === undefined ? null : (
                            <p key={id} className="flex items-center gap-2 text-text-muted">
                                <Swatch color={entry.rowColors?.[activeIndex] ?? chart.colors.get(id)!} kind={entry.kind} />
                                <span className="min-w-0 truncate">{entry.label}</span>
                                <span className="ml-auto pl-3 text-text tabular-nums">{write(value)}</span>
                            </p>
                        );
                    })}
                    {total && bucket.values.length > 0 && (
                        <p className="flex items-center gap-2 border-t border-border pt-1 font-medium text-text">
                            {t('total')}
                            <span className="ml-auto pl-3 tabular-nums">{write(sum)}</span>
                        </p>
                    )}
                    {bucket.notes.map((note) => (
                        <p key={note} className="text-text-faint">
                            {note}
                        </p>
                    ))}
                </>
            )}
        </Surface>,
        elements.tooltip
    );
}

/* The series with their color, in the order of the children. */
export function ChartLegend({ className, ref }: ChartLegendProps) {
    const chart = useChartContext('Chart.Legend');
    if (chart.elements.legend === null) {
        return null;
    }
    return createPortal(
        <ul ref={ref} className={clsx('flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted', className)}>
            {[...chart.series].map(([id, entry]) => (
                <li key={id} className="flex items-center gap-1.5">
                    <Swatch color={chart.colors.get(id)!} kind={entry.kind} />
                    {entry.label}
                </li>
            ))}
        </ul>,
        chart.elements.legend
    );
}

/* A toggle that shows every value as a table. Hidden, the table is still there for a screen reader. */
export function ChartTable({ className, ref }: ChartTableProps) {
    const chart = useChartContext('Chart.Table');
    const { t } = useTranslation('charts');
    const [shown, setShown] = useState(false);
    const id = useId();
    if (chart.elements.table === null) {
        return null;
    }
    const series = [...chart.series];
    const grouped = chart.groupKeys !== null;
    return createPortal(
        <div ref={ref} className={clsx('flex flex-col items-start gap-2', className)}>
            <Button size="sm" aria-expanded={shown} aria-controls={id} onClick={() => setShown((current) => !current)}>
                {shown ? t('values.hide') : t('values.show')}
            </Button>
            <div id={id} className={shown ? 'max-h-80 w-full overflow-auto rounded-md border border-border-soft' : 'sr-only'}>
                <table className={shown ? 'w-full border-collapse text-xs tabular-nums' : undefined}>
                    <caption className="sr-only">{t('values.caption', { label: chart.label })}</caption>
                    <thead className={shown ? 'sticky top-0 bg-surface-hover' : undefined}>
                        <tr>
                            {grouped && <td />}
                            <td />
                            {series.map(([seriesId, entry]) => (
                                <th
                                    key={seriesId}
                                    scope="col"
                                    className={shown ? 'h-8 px-2 text-right font-medium whitespace-nowrap text-text-muted' : undefined}
                                >
                                    {entry.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {chart.xs.map((key, index) => (
                            <tr key={String(key)} className={shown ? 'border-t border-border-soft' : undefined}>
                                {grouped && <td className={shown ? 'h-8 px-2 text-text-muted' : undefined}>{chart.groupKeys![index]}</td>}
                                <th scope="row" className={shown ? 'h-8 px-2 text-left font-normal whitespace-nowrap text-text-muted' : undefined}>
                                    {chart.formatX(key)}
                                </th>
                                {series.map(([seriesId, entry]) => {
                                    const value = entry.values[index];
                                    return (
                                        <td key={seriesId} className={shown ? 'h-8 px-2 text-right whitespace-nowrap text-text' : undefined}>
                                            {value === null || value === undefined ? '' : chart.formatY(value)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>,
        chart.elements.table
    );
}
