import { createContext, useContext } from 'react';
import type { BandLayout } from './band.ts';
import type { AxisWidths } from './group-axes.ts';
import type { ContinuousXScale, Stacked, YAxisScale } from './scale.ts';
import type { BandEntry, ChartStore, MarkerEntry, SeriesEntry } from './store.ts';
import type { ChartRect, ChartX, ChartXScale } from './types.ts';

export interface ChartSlots {
    readonly legend: HTMLElement | null;
    readonly table: HTMLElement | null;
    readonly tooltip: HTMLElement | null;
    readonly groups: HTMLElement | null;
    readonly left: SVGGElement | null;
    readonly right: SVGGElement | null;
}

export interface ChartContextValue {
    readonly store: ChartStore;
    readonly label: string;
    readonly data: readonly unknown[];
    readonly xs: readonly ChartX[];
    readonly xScale: ChartXScale;
    readonly height: number;
    /* In the coordinates of the plot's own svg, which scrolls apart from the y axes. */
    readonly plot: ChartRect;
    readonly width: number;
    readonly band: BandLayout | null;
    readonly continuous: ContinuousXScale | null;
    readonly y: YAxisScale;
    readonly yStep: number;
    readonly series: ReadonlyMap<string, SeriesEntry>;
    readonly stacked: ReadonlyMap<string, Stacked>;
    readonly colors: ReadonlyMap<string, string>;
    /* Where a column of a `Chart.Bar` stands among the others in its bucket. */
    readonly slots: ReadonlyMap<string, { slot: number; count: number }>;
    readonly markers: ReadonlyMap<string, MarkerEntry>;
    readonly bands: ReadonlyMap<string, BandEntry>;
    readonly groupKeys: readonly string[] | null;
    /* What a person reads for the group of each bucket. */
    readonly groupLabels: readonly string[] | null;
    readonly activeIndex: number;
    /* False in a chart that draws the cursor of another chart of its group, which shows the tooltip itself. */
    readonly ownsCursor: boolean;
    readonly selected: readonly boolean[];
    readonly dimmed: readonly boolean[];
    readonly elements: ChartSlots;
    /* The scroll of the plot, which the tooltip subtracts to stay at the cursor. */
    readonly scroll: number;
    /* The visible width of the chart, both y axes included. */
    readonly box: number;
    readonly leftAxis: number;
    readonly centerOf: (index: number) => number;
    /* The span of a bucket a column stands in: on a band scale, or on a time scale with a step. */
    readonly bucketAt: (index: number) => { readonly left: number; readonly width: number } | null;
    readonly pixelOfX: (x: ChartX) => number | null;
    readonly pixelOfY: (value: number) => number | null;
    readonly setActiveX: (x: ChartX | null) => void;
    readonly formatX: (x: ChartX) => string;
    readonly formatY: (value: number) => string;
    readonly notesAt: (index: number) => string[];
}

export const ChartContext = createContext<ChartContextValue | null>(null);

export function useChartContext(part: string): ChartContextValue {
    const context = useContext(ChartContext);
    if (context === null) {
        throw new Error(`${part} draws inside a Chart.Root.`);
    }
    return context;
}

/* The `Chart.Bars` a `Chart.Bar` is drawn in. */
export const BarsContext = createContext<{ id: string; stack: boolean } | null>(null);

export interface GroupCursor {
    readonly x: ChartX | null;
    /* The chart the pointer or the keyboard is in, the one that shows its tooltip. */
    readonly owner: string | null;
    readonly setX: (x: ChartX | null, owner: string) => void;
}

/* What the charts of a `Chart.Group` share: the cursor, the widths of their y axes, or both. */
export const GroupContext = createContext<{ cursor: GroupCursor | null; widths: AxisWidths | null } | null>(null);
