import { useId, useState, type CSSProperties, type KeyboardEvent, type Ref } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Button, Surface } from '@adecore/ui';
import { formatNumber } from '@adecore/ui/format';
import { colorOf } from './color.ts';
import { heatShare, heatStep, moveCell, type HeatCell } from './heat.ts';
import type { ChartColor } from './types.ts';

/* A row or a column of a heatmap. */
export interface HeatmapAxisItem {
    readonly key: string | number;
    /* What the tooltip, the live region and the table call it, such as "Monday" or "09:00". */
    readonly label: string;
    /* What the axis writes, such as "Mon"; `null` leaves the axis blank there, as for every hour but each sixth. */
    readonly short?: string | null;
}

export interface HeatmapProps {
    readonly rows: readonly HeatmapAxisItem[];
    readonly columns: readonly HeatmapAxisItem[];
    /* By row, then by column. A missing value (`null`) and a value of zero or less draw an empty cell. */
    readonly values: readonly (readonly (number | null)[])[];
    /* The name of the heatmap, for a screen reader and the table of values. */
    readonly label: string;
    /* What a value counts, such as "Events", in the tooltip, the live region and the table. */
    readonly valueLabel: string;
    readonly tone?: ChartColor;
    /* How many shades the values fall into, besides the empty cell. */
    readonly steps?: number;
    /* The value of the darkest step; the highest value by default. A shared `max` lets two heatmaps compare. */
    readonly max?: number;
    readonly format?: (value: number) => string;
    /* In pixels; the width of a cell follows the container. */
    readonly cellHeight?: number;
    readonly legend?: boolean;
    /* Adds a "Show values" toggle; without it the table is there for a screen reader only. */
    readonly table?: boolean;
    readonly className?: string;
    readonly ref?: Ref<HTMLDivElement>;
}

/* Between a cell and the card beside it. */
const OFFSET = 8;

const shade = (color: string, share: number): string | undefined => (share === 0 ? undefined : `color-mix(in srgb, ${color} ${share}%, transparent)`);

/* The card hangs toward the side of the grid with the most room, so it covers neither the cell nor the edge. */
const cardPlace = (toRight: boolean, down: boolean): CSSProperties => ({
    left: toRight ? `calc(100% + ${OFFSET}px)` : undefined,
    right: toRight ? undefined : `calc(100% + ${OFFSET}px)`,
    top: down ? 0 : undefined,
    bottom: down ? undefined : 0
});

/* A grid of rows by columns, each cell shaded by its value, such as events per weekday and hour. */
export function Heatmap({
    rows,
    columns,
    values,
    label,
    valueLabel,
    tone = 'accent',
    steps = 5,
    max,
    format = formatNumber,
    cellHeight = 16,
    legend = true,
    table = false,
    className,
    ref
}: HeatmapProps) {
    const { t } = useTranslation('charts');
    const id = useId();
    const [active, setActive] = useState<HeatCell | null>(null);
    const [announce, setAnnounce] = useState(false);
    const [shown, setShown] = useState(false);

    const color = colorOf(tone)!;
    const valueAt = (row: number, column: number): number | null => values[row]?.[column] ?? null;
    const top = max ?? Math.max(0, ...values.flatMap((line) => line.filter((value): value is number => value !== null && Number.isFinite(value))));
    const empty = rows.length === 0 || columns.length === 0;
    const write = (value: number | null): string => (value === null ? '-' : format(value));
    const describe = (cell: HeatCell): string => {
        const value = valueAt(cell.row, cell.column);
        return `${rows[cell.row]!.label}, ${columns[cell.column]!.label}, ${value === null ? t('noData') : `${valueLabel} ${format(value)}`}`;
    };
    const current = active !== null && active.row < rows.length && active.column < columns.length ? active : null;

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
        const target = moveCell(e.key, current, rows.length, columns.length, e.ctrlKey || e.metaKey);
        if (target === undefined) {
            return;
        }
        e.preventDefault();
        setAnnounce(target !== null);
        setActive(target);
    };

    return (
        <div ref={ref} className={clsx('flex min-w-0 flex-col gap-2', className)}>
            <div
                role="group"
                tabIndex={0}
                aria-roledescription={t('heatmap.name')}
                aria-label={label}
                aria-describedby={`${id}-hint`}
                className="focus-ring rounded-xs"
                onKeyDown={onKeyDown}
                onPointerLeave={() => setActive(null)}
                onBlur={() => {
                    setActive(null);
                    setAnnounce(false);
                }}
            >
                {empty ? (
                    <p className="py-6 text-center text-xs text-text-faint">{t('noData')}</p>
                ) : (
                    <div
                        aria-hidden
                        className="grid gap-0.5 text-xs text-text-muted"
                        style={{ gridTemplateColumns: `auto repeat(${columns.length}, minmax(0, 1fr))` }}
                    >
                        <span />
                        {columns.map((column) => (
                            <span key={column.key} className="flex justify-center leading-4 whitespace-nowrap tabular-nums">
                                {column.short === undefined ? column.label : column.short}
                            </span>
                        ))}
                        {rows.map((row, rowIndex) => (
                            <div key={row.key} className="contents">
                                <span className="flex items-center pr-2 leading-4 whitespace-nowrap">{row.short === undefined ? row.label : row.short}</span>
                                {columns.map((column, columnIndex) => {
                                    const value = valueAt(rowIndex, columnIndex);
                                    const step = heatStep(value, top, steps);
                                    const isActive = current !== null && current.row === rowIndex && current.column === columnIndex;
                                    return (
                                        <span
                                            key={column.key}
                                            data-step={step}
                                            className={clsx(
                                                'rounded-xs',
                                                step === 0 && 'bg-surface-sunken',
                                                isActive && 'relative z-10 outline-1 outline-offset-1 outline-text'
                                            )}
                                            style={{ height: cellHeight, backgroundColor: shade(color, heatShare(step, steps)) }}
                                            onPointerEnter={() => {
                                                setAnnounce(false);
                                                setActive({ row: rowIndex, column: columnIndex });
                                            }}
                                        >
                                            {isActive && (
                                                <Surface
                                                    className="pointer-events-none absolute flex w-max min-w-36 flex-col gap-1 rounded-lg px-2.5 py-2 text-xs"
                                                    style={cardPlace(columnIndex < columns.length / 2, rowIndex < rows.length / 2)}
                                                >
                                                    <p className="font-medium whitespace-nowrap text-text">
                                                        {row.label} · {column.label}
                                                    </p>
                                                    <p className="flex items-center gap-2 text-text-muted">
                                                        <span
                                                            className={clsx('size-2 shrink-0 rounded-xs', step === 0 && 'bg-surface-sunken')}
                                                            style={{ backgroundColor: shade(color, heatShare(step, steps)) }}
                                                        />
                                                        <span className="min-w-0 truncate">{valueLabel}</span>
                                                        <span className="ml-auto pl-3 text-text tabular-nums">{write(value)}</span>
                                                    </p>
                                                </Surface>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {legend && !empty && (
                <div aria-hidden className="flex items-center justify-end gap-1 text-xs text-text-muted">
                    <span className="mr-1">{t('heatmap.less')}</span>
                    {Array.from({ length: steps + 1 }, (_, step) => (
                        <span
                            key={step}
                            className={clsx('size-3 rounded-xs', step === 0 && 'bg-surface-sunken')}
                            style={{ backgroundColor: shade(color, heatShare(step, steps)) }}
                        />
                    ))}
                    <span className="ml-1">{t('heatmap.more')}</span>
                </div>
            )}
            {!empty && (
                <div className={table ? 'flex flex-col items-start gap-2' : undefined}>
                    {table && (
                        <Button size="sm" aria-expanded={shown} aria-controls={`${id}-table`} onClick={() => setShown((open) => !open)}>
                            {shown ? t('values.hide') : t('values.show')}
                        </Button>
                    )}
                    <div id={`${id}-table`} className={table && shown ? 'max-h-80 w-full overflow-auto rounded-md border border-border-soft' : 'sr-only'}>
                        <table className={table && shown ? 'w-full border-collapse text-xs tabular-nums' : undefined}>
                            <caption className="sr-only">{t('values.caption', { label })}</caption>
                            <thead className={table && shown ? 'sticky top-0 bg-surface-hover' : undefined}>
                                <tr>
                                    <td />
                                    {columns.map((column) => (
                                        <th
                                            key={column.key}
                                            scope="col"
                                            className={table && shown ? 'h-8 px-2 text-right font-medium whitespace-nowrap text-text-muted' : undefined}
                                        >
                                            {column.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, rowIndex) => (
                                    <tr key={row.key} className={table && shown ? 'border-t border-border-soft' : undefined}>
                                        <th
                                            scope="row"
                                            className={table && shown ? 'h-8 px-2 text-left font-normal whitespace-nowrap text-text-muted' : undefined}
                                        >
                                            {row.label}
                                        </th>
                                        {columns.map((column, columnIndex) => {
                                            const value = valueAt(rowIndex, columnIndex);
                                            return (
                                                <td key={column.key} className={table && shown ? 'h-8 px-2 text-right whitespace-nowrap text-text' : undefined}>
                                                    {value === null ? '' : format(value)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <p id={`${id}-hint`} className="sr-only">
                {t('heatmap.keyboard')}
            </p>
            <p aria-live="polite" className="sr-only">
                {announce && current !== null ? describe(current) : ''}
            </p>
        </div>
    );
}
