import {
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
    useSyncExternalStore,
    type KeyboardEvent,
    type MouseEvent,
    type PointerEvent,
    type ReactNode,
    type Ref
} from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useContentSize } from '@adecore/ui';
import { formatNumber, formatRounded } from '@adecore/ui/format';
import { readValue, warnMissingKey, xOf } from './access.ts';
import { bandLayout } from './band.ts';
import { seriesColor } from './color.ts';
import { ChartContext, GroupContext, type ChartContextValue } from './context.ts';
import { containingIndex, moveIndex, nearestIndex, snapIndex } from './cursor.ts';
import { useAlignedAxes } from './group-axes.ts';
import { bucketStepOf, continuousXScale, extentOf, stackSeries, tickCount, yScaleOf } from './scale.ts';
import { createChartStore } from './store.ts';
import { formatTime, timeLabelOf } from './time-format.ts';
import type { ChartAccessor, ChartX, ChartXInput, ChartXScale, ChartYOptions, ChartYScale } from './types.ts';

export interface ChartRootProps<Row> {
    /* One row per bucket. On a time or linear scale the rows run from the lowest x to the highest. */
    readonly data: readonly Row[];
    readonly x: ChartAccessor<Row, ChartXInput>;
    readonly xScale?: ChartXScale;
    /* The length of a bucket on a time scale, in milliseconds; the smallest distance between two rows by default. */
    readonly step?: number;
    readonly yScale?: ChartYScale;
    /* Fixed ends of the value axis; without them it covers every series and rounds out to a tick. */
    readonly y?: ChartYOptions;
    /* The name of the chart, for a screen reader and the table of values. */
    readonly label: string;
    /* In pixels, the x axis included. The width follows the container. */
    readonly height?: number;
    /* Controls the cursor. Leaving the chart then leaves it where it is. */
    readonly activeX?: ChartX | null;
    readonly onActiveXChange?: (x: ChartX | null) => void;
    /* Puts the buckets of a band scale into runs of the same key, with a gap between them. */
    readonly group?: ChartAccessor<Row, string>;
    /* The narrowest a bucket of a band scale may be; below that the plot scrolls sideways under a y axis that stays. */
    readonly minBucketWidth?: number;
    /* The x of every bucket that is picked, which stays highlighted and is pressed for a screen reader. */
    readonly selected?: readonly ChartX[];
    /* Makes the buckets pressable: Enter, Space and a click. */
    readonly onActivate?: (row: Row, index: number) => void;
    /* The buckets the app wants out of focus. */
    readonly dimmed?: (row: Row, index: number) => boolean;
    readonly children?: ReactNode;
    readonly className?: string;
    readonly ref?: Ref<HTMLDivElement>;
}

const TOP = 8;
/* Room for the dot at the end of a line on a continuous scale, which would otherwise stand on the edge. */
const INSET = 6;
const Y_TICK_SPACING = 40;

const defaultValue = (value: number): string => (Number.isInteger(value) ? formatNumber(value) : formatRounded(value, 2));

/* The box of a chart: owns the data, the scales, the cursor and the keyboard; each part inside draws one layer. */
export function ChartRoot<Row>({
    data,
    x,
    xScale = 'band',
    step: stepProp,
    yScale = 'linear',
    y = {},
    label,
    height = 200,
    activeX,
    onActiveXChange,
    group,
    minBucketWidth = 0,
    selected,
    onActivate,
    dimmed,
    children,
    className,
    ref
}: ChartRootProps<Row>) {
    const { t } = useTranslation('charts');
    const id = useId();
    const [store] = useState(createChartStore);
    const series = useSyncExternalStore(store.subscribe, store.series, store.series);
    const axes = useSyncExternalStore(store.subscribe, store.axes, store.axes);
    const markers = useSyncExternalStore(store.subscribe, store.markers, store.markers);
    const bands = useSyncExternalStore(store.subscribe, store.bands, store.bands);
    const formats = useSyncExternalStore(store.subscribe, store.formats, store.formats);
    const chartGroup = useContext(GroupContext);
    const sharedCursor = chartGroup?.cursor ?? null;
    const [ownX, setOwnX] = useState<ChartX | null>(null);
    const [legendSlot, setLegendSlot] = useState<HTMLElement | null>(null);
    const [tableSlot, setTableSlot] = useState<HTMLElement | null>(null);
    const [tooltipSlot, setTooltipSlot] = useState<HTMLElement | null>(null);
    const [groupsSlot, setGroupsSlot] = useState<HTMLElement | null>(null);
    const [leftSlot, setLeftSlot] = useState<SVGGElement | null>(null);
    const [rightSlot, setRightSlot] = useState<SVGGElement | null>(null);
    const [scroll, setScroll] = useState(0);
    const [announce, setAnnounce] = useState(false);
    const [measure, size] = useContentSize();
    const scroller = useRef<HTMLDivElement>(null);

    const band = xScale === 'band';
    const xs = data.map((row, index) => xOf(readValue(x, row, index)));
    const groupKeys = band && group !== undefined ? data.map((row, index) => String(readValue(group, row, index))) : null;
    const [leftAxis, rightAxis] = useAlignedAxes(chartGroup?.widths ?? null, axes.left ?? 0, axes.right ?? 0);
    const room = Math.max(0, size.width - leftAxis - rightAxis);
    // A bucket of a time scale runs from its x for one step and its point stands in the middle, as a column would.
    const bucketStep = xScale === 'time' ? (stepProp ?? bucketStepOf(xs as number[])) : 0;
    const inset = band || bucketStep > 0 ? 0 : INSET;
    const layout = band ? bandLayout(xs.length, groupKeys, room, minBucketWidth) : null;
    const width = layout === null ? room : Math.max(room, Math.ceil(layout.width));
    const bottom = height - (axes.x ?? 4);
    const plot = { left: inset, top: TOP, right: width - inset, bottom, width: Math.max(0, width - 2 * inset), height: Math.max(0, bottom - TOP) };
    const continuous = band ? null : continuousXScale(xScale, xs as number[], [plot.left, plot.right], bucketStep);

    const stackInput = [...series].map(([seriesId, entry]) => ({ id: seriesId, values: entry.values, stack: entry.stack }));
    const stacked = stackSeries(stackInput, xs.length);
    const scaleY = yScaleOf(yScale, extentOf(stacked.values(), yScale), y, [plot.bottom, plot.top], axes.yTicks ?? tickCount(plot.height, Y_TICK_SPACING));
    const yStep = scaleY.ticks.length > 1 ? scaleY.ticks[1]! - scaleY.ticks[0]! : 1;

    const colors = new Map<string, string>();
    let next = 0;
    for (const [seriesId, entry] of series) {
        colors.set(seriesId, entry.color ?? seriesColor(next++));
    }
    const slots = new Map<string, { slot: number; count: number }>();
    const members = new Map<string, string[]>();
    for (const [seriesId, entry] of series) {
        if (entry.kind === 'bar') {
            members.set(entry.bars ?? '', [...(members.get(entry.bars ?? '') ?? []), seriesId]);
        }
    }
    for (const ids of members.values()) {
        const stackedBars = ids.some((seriesId) => series.get(seriesId)!.stack !== null);
        ids.forEach((seriesId, index) => slots.set(seriesId, stackedBars ? { slot: 0, count: 1 } : { slot: index, count: ids.length }));
    }

    const centerOf = (index: number): number => {
        if (layout !== null) {
            return plot.left + (layout.lefts[index] ?? 0) + layout.bucket / 2;
        }
        return continuous!.at((xs[index] as number) + bucketStep / 2);
    };
    const bucketAt = (index: number): { left: number; width: number } | null => {
        if (layout !== null) {
            return { left: plot.left + (layout.lefts[index] ?? 0), width: layout.bucket };
        }
        if (bucketStep <= 0 || xs[index] === undefined) {
            return null;
        }
        const left = continuous!.at(xs[index] as number);
        return { left, width: continuous!.at((xs[index] as number) + bucketStep) - left };
    };
    const pixelOfX = (value: ChartX): number | null => {
        if (layout !== null) {
            const index = xs.findIndex((key) => String(key) === String(value));
            return index < 0 ? null : centerOf(index);
        }
        return typeof value === 'number' ? continuous!.at(value) : null;
    };
    const pixelOfY = (value: number): number | null => scaleY.at(value);

    const span = continuous === null ? 0 : continuous.domain[1] - continuous.domain[0];
    const formatX = (value: ChartX): string => {
        if (formats.x !== undefined) {
            return formats.x(value);
        }
        if (xScale === 'time' && typeof value === 'number') {
            return formatTime(value, timeLabelOf(span, bucketStep));
        }
        return typeof value === 'number' ? defaultValue(value) : value;
    };
    const formatY = formats.y ?? defaultValue;

    const notesAt = (index: number): string[] => {
        const at = xs[index];
        if (at === undefined) {
            return [];
        }
        const notes: string[] = [];
        for (const marker of markers.values()) {
            const inside = band
                ? String(marker.at) === String(at)
                : typeof marker.at === 'number' && containingIndex(xs as number[], marker.at, bucketStep || undefined) === index;
            if (inside) {
                notes.push(marker.label);
            }
        }
        for (const range of bands.values()) {
            let inside: boolean;
            if (band) {
                const from = xs.findIndex((key) => String(key) === String(range.from));
                const to = xs.findIndex((key) => String(key) === String(range.to));
                inside = from >= 0 && to >= 0 && index >= Math.min(from, to) && index <= Math.max(from, to);
            } else if (bucketStep > 0) {
                inside = (at as number) < (range.to as number) && (at as number) + bucketStep > (range.from as number);
            } else {
                inside = (at as number) >= (range.from as number) && (at as number) < (range.to as number);
            }
            if (inside) {
                notes.push(range.label);
            }
        }
        return notes;
    };

    const controlled = activeX !== undefined;
    const cursorX = controlled ? activeX : sharedCursor !== null ? sharedCursor.x : ownX;
    const activeIndex = snapIndex(xs, xScale, cursorX, bucketStep);
    const ownsCursor = controlled || sharedCursor === null || sharedCursor.owner === id;
    const setActiveX = (value: ChartX | null): void => {
        if (!controlled) {
            if (sharedCursor !== null) {
                sharedCursor.setX(value, id);
            } else {
                setOwnX(value);
            }
        }
        onActiveXChange?.(value);
    };

    const picked = new Set((selected ?? []).map(String));
    const selectedRows = xs.map((key) => picked.has(String(key)));
    const dimmedRows = data.map((row, index) => dimmed?.(row, index) ?? false);

    const describe = (index: number): string => {
        const parts = [groupKeys?.[index], formatX(xs[index]!)].filter((part): part is string => part !== undefined);
        for (const entry of series.values()) {
            const value = entry.values[index];
            if (value !== null && value !== undefined) {
                parts.push(`${entry.label} ${formatY(value)}`);
            }
        }
        return [...parts, ...notesAt(index)].join(', ');
    };

    useEffect(() => {
        warnMissingKey(x, data, 'Chart.Root');
    }, [x, data]);

    const indexAtPointer = (e: MouseEvent<SVGSVGElement>): number => {
        const pixel = e.clientX - e.currentTarget.getBoundingClientRect().left;
        return nearestIndex(
            xs.map((_, index) => centerOf(index)),
            pixel
        );
    };

    const onPointerMove = (e: PointerEvent<SVGSVGElement>): void => {
        setAnnounce(false);
        if (xs.length === 0) {
            return;
        }
        if (continuous !== null) {
            const pixel = e.clientX - e.currentTarget.getBoundingClientRect().left;
            // The end of the last bucket is the start of none, so the pointer stops a pixel short of it.
            setActiveX(continuous.invert(Math.min(plot.right - 1, Math.max(plot.left, pixel))));
            return;
        }
        const index = indexAtPointer(e);
        if (index >= 0 && String(xs[index]) !== String(cursorX)) {
            setActiveX(xs[index]!);
        }
    };

    const onPointerLeave = (): void => {
        if (!controlled) {
            setActiveX(null);
        }
    };

    const activate = (index: number): void => {
        if (onActivate !== undefined && index >= 0) {
            onActivate(data[index]!, index);
        }
    };

    const onKeyDown = (e: KeyboardEvent<SVGSVGElement>): void => {
        if (onActivate !== undefined && activeIndex >= 0 && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            activate(activeIndex);
            return;
        }
        const groupStarts = layout?.groups.map((run) => run.first) ?? [];
        const target = moveIndex(e.key, activeIndex, xs.length, groupStarts);
        if (target === undefined) {
            return;
        }
        e.preventDefault();
        if (target === null) {
            setActiveX(null);
            return;
        }
        setAnnounce(true);
        setActiveX(xs[target]!);
        const box = scroller.current;
        if (box !== null && box.scrollWidth > box.clientWidth) {
            const center = centerOf(target);
            if (center < box.scrollLeft || center > box.scrollLeft + box.clientWidth) {
                box.scrollLeft = Math.max(0, center - box.clientWidth / 2);
            }
        }
    };

    const context: ChartContextValue = {
        store,
        label,
        data,
        xs,
        xScale,
        height,
        plot,
        width,
        band: layout,
        continuous,
        y: scaleY,
        yStep,
        series,
        stacked,
        colors,
        slots,
        markers,
        bands,
        groupKeys,
        activeIndex,
        ownsCursor,
        selected: selectedRows,
        dimmed: dimmedRows,
        elements: { legend: legendSlot, table: tableSlot, tooltip: tooltipSlot, groups: groupsSlot, left: leftSlot, right: rightSlot },
        scroll,
        box: size.width,
        leftAxis,
        centerOf,
        bucketAt,
        pixelOfX,
        pixelOfY,
        setActiveX,
        formatX,
        formatY,
        notesAt
    };

    const pressable = onActivate !== undefined && layout !== null;
    const scrolls = layout !== null && width > room;
    const hint = [t('keyboard.move'), layout !== null && layout.groups.length > 0 ? t('keyboard.groups') : null, pressable ? t('keyboard.activate') : null]
        .filter(Boolean)
        .join(' ');
    const highlighted = layout === null ? [] : xs.flatMap((_, index) => (index === activeIndex || selectedRows[index] ? [index] : []));

    return (
        <ChartContext value={context}>
            <div ref={ref} className={clsx('flex min-w-0 flex-col gap-3', className)}>
                <div ref={setLegendSlot} className="empty:hidden" />
                <div ref={measure} className="focus-ring-within relative flex rounded-md">
                    <svg width={leftAxis} height={height} aria-hidden className="shrink-0 overflow-visible">
                        <g ref={setLeftSlot} />
                    </svg>
                    <div
                        ref={scroller}
                        className={clsx('min-w-0 flex-1', scrolls ? 'overflow-x-auto overflow-y-hidden overscroll-x-contain' : 'overflow-visible')}
                        onScroll={(e) => setScroll(e.currentTarget.scrollLeft)}
                    >
                        <svg
                            width={width}
                            height={height}
                            role="group"
                            tabIndex={0}
                            aria-roledescription={t('chart')}
                            aria-label={label}
                            aria-describedby={`${id}-hint`}
                            aria-activedescendant={pressable && activeIndex >= 0 ? `${id}-${activeIndex}` : undefined}
                            className={clsx('block overflow-visible outline-none', pressable && 'cursor-pointer')}
                            onPointerMove={onPointerMove}
                            onPointerLeave={onPointerLeave}
                            onClick={pressable ? (e) => activate(indexAtPointer(e)) : undefined}
                            onKeyDown={onKeyDown}
                            onBlur={() => setAnnounce(false)}
                        >
                            {layout !== null &&
                                highlighted.map((index) => (
                                    <rect
                                        key={index}
                                        x={Math.round(plot.left + layout.lefts[index]!)}
                                        y={plot.top}
                                        width={Math.max(1, Math.round(layout.bucket))}
                                        height={plot.height}
                                        className="fill-surface-hover"
                                    />
                                ))}
                            {children}
                            {continuous !== null && activeIndex >= 0 && <Crosshair context={context} />}
                            {pressable &&
                                xs.map((key, index) => (
                                    <rect
                                        key={String(key)}
                                        id={`${id}-${index}`}
                                        role="button"
                                        aria-pressed={selectedRows[index]}
                                        aria-label={describe(index)}
                                        x={Math.round(plot.left + layout.lefts[index]!)}
                                        y={plot.top}
                                        width={Math.max(1, Math.round(layout.bucket))}
                                        height={height - plot.top}
                                        fill="transparent"
                                    />
                                ))}
                            {xs.length === 0 && (
                                <text
                                    x={Math.round((plot.left + plot.right) / 2)}
                                    y={Math.round((plot.top + plot.bottom) / 2)}
                                    dy="0.32em"
                                    textAnchor="middle"
                                    className="fill-text-faint text-xs"
                                >
                                    {t('noData')}
                                </text>
                            )}
                        </svg>
                        <div ref={setGroupsSlot} className="empty:hidden" style={{ width }} />
                    </div>
                    <svg width={rightAxis} height={height} aria-hidden className="shrink-0 overflow-visible">
                        <g ref={setRightSlot} />
                    </svg>
                    <div ref={setTooltipSlot} className="pointer-events-none absolute inset-0" />
                </div>
                <div ref={setTableSlot} className="empty:hidden" />
                <p id={`${id}-hint`} className="sr-only">
                    {hint}
                </p>
                <p aria-live="polite" className="sr-only">
                    {announce && activeIndex >= 0 ? describe(activeIndex) : ''}
                </p>
            </div>
        </ChartContext>
    );
}

/* The line at the cursor and a dot where it crosses each line and area. */
function Crosshair({ context }: { context: ChartContextValue }) {
    const { activeIndex, centerOf, plot, series, stacked, colors, pixelOfY } = context;
    const left = Math.round(centerOf(activeIndex)) + 0.5;
    return (
        <g className="pointer-events-none">
            <line x1={left} x2={left} y1={plot.top} y2={plot.bottom} className="stroke-border-strong" />
            {[...series].map(([seriesId, entry]) => {
                const top = stacked.get(seriesId)?.top[activeIndex];
                const pixel = top === null || top === undefined || entry.kind === 'bar' ? null : pixelOfY(top);
                return pixel === null ? null : (
                    <circle
                        key={seriesId}
                        cx={left}
                        cy={Math.round(pixel)}
                        r={4}
                        className="stroke-surface"
                        strokeWidth={2}
                        style={{ fill: colors.get(seriesId) }}
                    />
                );
            })}
        </g>
    );
}
