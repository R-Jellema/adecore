import type { ReactNode } from 'react';
import type { ChartGroupAxisProps } from './axes.tsx';
import * as Chart from './index.parts.ts';
import type { ChartTooltipProps } from './overlays.tsx';
import type { ChartRootProps } from './Root.tsx';
import type { ChartAreaProps, ChartBarProps, ChartLineProps } from './series.tsx';

/* The parts of `Chart` with the keys and accessors of `x`, `group` and `value` checked against `Row`. */
export interface TypedChart<Row> extends Omit<typeof Chart, 'Root' | 'GroupAxis' | 'Line' | 'Area' | 'Bar' | 'Tooltip'> {
    readonly Root: (props: ChartRootProps<Row>) => ReactNode;
    readonly GroupAxis: (props: ChartGroupAxisProps<Row>) => ReactNode;
    readonly Line: (props: ChartLineProps<Row>) => ReactNode;
    readonly Area: (props: ChartAreaProps<Row>) => ReactNode;
    readonly Bar: (props: ChartBarProps<Row>) => ReactNode;
    readonly Tooltip: (props: ChartTooltipProps<Row>) => ReactNode;
}

/* The same parts as `Chart`, typed for one kind of row. Nothing is made: it hands back `Chart` under another type. */
export function createChart<Row>(): TypedChart<Row> {
    return Chart;
}
