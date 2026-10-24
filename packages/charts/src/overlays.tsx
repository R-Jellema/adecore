import { useId, useState, type ReactNode, type Ref } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Surface } from '@adecore/ui';
import { useChartContext, type ChartContextValue } from './context.ts';
import type { SeriesEntry } from './store.ts';
import type { ChartNote, ChartX } from './types.ts';

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
    /* The key of the bucket's group, null without groups. */
    readonly group: string | null;
    /* What a person reads for the group: `groupLabel` of the root, else the key. */
    readonly groupLabel: string | null;
    readonly values: readonly ChartBucketValue[];
    /* The markers and bands of the bucket. */
    readonly notes: readonly ChartNote[];
}

export interface ChartTooltipProps<Row> {
    /* A line with the sum of the values under the series, named "Total" or by the string given, such as "Runs". */
    readonly total?: boolean | string;
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

/* The color a series has in a row: its own per row, else on a point chart the color of the row's series. */
const colorAt = (chart: ChartContextValue, id: string, entry: SeriesEntry, index: number): string =>
    entry.rowColors?.[index] ?? (chart.points ? (entry.color ?? chart.groupColorOf(index)) : chart.colors.get(id)!);

const bucketOf = <Row,>(chart: ChartContextValue, index: number): ChartBucket<Row> => ({
    index,
    x: chart.xs[index]!,
    row: chart.data[index] as Row,
    group: chart.groupKeys?.[index] ?? null,
    groupLabel: chart.groupLabels?.[index] ?? null,
    values: chart.readable.flatMap(([id, entry]) => {
        const value = entry.values[index];
        return value === null || value === undefined ? [] : [{ label: entry.label, color: colorAt(chart, id, entry, index), value }];
    }),
    notes: chart.notesAt(index)
});

/* The swatch of a series: its icon in its color, else a dash for a line and a square for a column. */
function Swatch({ color, entry, size }: { color: string; entry: SeriesEntry; size: 12 | 14 }) {
    if (entry.icon !== null) {
        return (
            <span className="inline-flex shrink-0" style={{ color }}>
                <Icon icon={entry.icon} size={size} />
            </span>
        );
    }
    return <span className={clsx('shrink-0', entry.kind === 'bar' ? 'size-2 rounded-xs' : 'h-0.5 w-3 rounded-full')} style={{ background: color }} />;
}

/* A dashed stroke for a marker, a square for a band, in their color. */
function NoteSwatch({ note }: { note: ChartNote }) {
    return note.kind === 'marker' ? (
        <span className="flex w-2 shrink-0 justify-center">
            <span className="h-2.5 border-l border-dashed" style={{ borderColor: note.color }} />
        </span>
    ) : (
        <span className="size-2 shrink-0 rounded-xs" style={{ background: note.color }} />
    );
}

/* The card at the cursor: the x of the bucket, a row per series, then its markers and bands. */
export function ChartTooltip<Row>({ total = false, format, children, className, ref }: ChartTooltipProps<Row>) {
    const chart = useChartContext('Chart.Tooltip');
    const { t } = useTranslation('charts');
    const { activeIndex, elements } = chart;
    if (activeIndex < 0 || elements.tooltip === null || !chart.ownsCursor) {
        return null;
    }
    const bucket = bucketOf<Row>(chart, activeIndex);
    const write = format ?? chart.formatY;
    const position = chart.points ? chart.positions[activeIndex] : null;
    const pixel = chart.leftAxis + (position?.[0] ?? chart.centerOf(activeIndex)) - chart.scroll;
    // The card hangs on the side with the most room, so it never covers the cursor and never runs off.
    const right = pixel > chart.box / 2;
    const place = right
        ? { right: Math.round(chart.box - pixel + OFFSET), maxWidth: Math.max(0, Math.round(pixel - OFFSET - EDGE)) }
        : { left: Math.round(pixel + OFFSET), maxWidth: Math.max(0, Math.round(chart.box - pixel - OFFSET - EDGE)) };
    const sum = bucket.values.reduce((all, entry) => all + entry.value, 0);
    // A point names its series and itself; its x is a value like the others, under the title of its axis.
    const heading = chart.points
        ? [bucket.groupLabel, chart.rowLabels?.[activeIndex]].filter(Boolean).join(' · ') || chart.formatX(bucket.x)
        : [bucket.groupLabel, chart.formatX(bucket.x)].filter(Boolean).join(' · ');
    return createPortal(
        <Surface
            ref={ref}
            aria-hidden
            className={clsx('absolute flex w-max min-w-36 flex-col gap-1 rounded-lg px-2.5 py-2 text-xs', className)}
            style={{ top: position === null || position === undefined ? chart.plot.top : Math.max(0, Math.round(position[1]) - OFFSET), ...place }}
        >
            {children !== undefined ? (
                children(bucket)
            ) : (
                <>
                    <p className="font-medium text-text">{heading}</p>
                    {chart.points && (
                        <p className="flex items-center gap-2 text-text-muted">
                            <span className="min-w-0 truncate">{chart.xTitle}</span>
                            <span className="ml-auto pl-3 text-text tabular-nums">{chart.formatX(bucket.x)}</span>
                        </p>
                    )}
                    {chart.readable.map(([id, entry]) => {
                        const value = entry.values[activeIndex];
                        // A series without a value here still gets its row, so a gap reads as nothing measured.
                        return (
                            <p key={id} className="flex items-center gap-2 text-text-muted">
                                <Swatch color={colorAt(chart, id, entry, activeIndex)} entry={entry} size={12} />
                                <span className="min-w-0 truncate">{entry.label}</span>
                                <span className="ml-auto pl-3 text-text tabular-nums">{value === null || value === undefined ? '-' : write(value)}</span>
                            </p>
                        );
                    })}
                    {total !== false && bucket.values.length > 0 && (
                        <p className="flex items-center gap-2 border-t border-border pt-1 font-medium text-text">
                            {total === true ? t('total') : total}
                            <span className="ml-auto pl-3 tabular-nums">{write(sum)}</span>
                        </p>
                    )}
                    {bucket.notes.map((note) => (
                        <div key={`${note.kind}:${note.label}`} className="border-t border-border-soft pt-1">
                            <p className="flex items-center gap-2 text-text">
                                <NoteSwatch note={note} />
                                {note.label}
                            </p>
                            {note.detail !== null && <p className="pl-4 text-text-muted">{note.detail}</p>}
                        </div>
                    ))}
                </>
            )}
        </Surface>,
        elements.tooltip
    );
}

/* The series with their color, in the order of the children; on a point chart the series of its groups. */
export function ChartLegend({ className, ref }: ChartLegendProps) {
    const chart = useChartContext('Chart.Legend');
    if (chart.elements.legend === null) {
        return null;
    }
    return createPortal(
        <ul ref={ref} className={clsx('flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted', className)}>
            {chart.points && chart.groupKeys !== null
                ? chart.pointGroups.map((run) => (
                      <li key={run.key} className="flex items-center gap-1.5">
                          <span className="size-2 shrink-0 rounded-full" style={{ background: chart.pointColor(run.indexes[0]!) }} />
                          {chart.groupLabels?.[run.indexes[0]!] ?? run.key}
                      </li>
                  ))
                : [...chart.series].map(([id, entry]) => (
                      <li key={id} className="flex items-center gap-1.5">
                          <Swatch color={chart.colors.get(id)!} entry={entry} size={14} />
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
    const series = chart.readable;
    const grouped = chart.groupKeys !== null;
    // A point names itself by its label where it has one, and its x stands in a column of its own.
    const xColumn = chart.points && chart.rowLabels !== null;
    const cell = shown ? 'h-8 px-2 text-right whitespace-nowrap text-text' : undefined;
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
                            {xColumn && (
                                <th scope="col" className={shown ? 'h-8 px-2 text-right font-medium whitespace-nowrap text-text-muted' : undefined}>
                                    {chart.xTitle}
                                </th>
                            )}
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
                        {chart.xs.map((key, index) =>
                            // A point without a position is a gap, which the chart does not draw either.
                            chart.points && chart.positions[index] === null ? null : (
                                <tr key={chart.keys?.[index] ?? String(key)} className={shown ? 'border-t border-border-soft' : undefined}>
                                    {grouped && <td className={shown ? 'h-8 px-2 text-text-muted' : undefined}>{chart.groupLabels![index]}</td>}
                                    <th scope="row" className={shown ? 'h-8 px-2 text-left font-normal whitespace-nowrap text-text-muted' : undefined}>
                                        {xColumn ? chart.rowLabels![index] : chart.formatX(key)}
                                    </th>
                                    {xColumn && <td className={cell}>{Number.isFinite(key) ? chart.formatX(key) : ''}</td>}
                                    {series.map(([seriesId, entry]) => {
                                        const value = entry.values[index];
                                        return (
                                            <td key={seriesId} className={cell}>
                                                {value === null || value === undefined ? '' : chart.formatY(value)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>,
        chart.elements.table
    );
}
