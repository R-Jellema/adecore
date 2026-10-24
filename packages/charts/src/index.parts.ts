import type { ReactNode } from 'react';
import { ChartBand, ChartMarker, ChartRule } from './annotations.tsx';
import { ChartGrid, ChartGroupAxis, ChartXAxis, ChartYAxis, type ChartGroupAxisProps } from './axes.tsx';
import { ChartGroup, ChartLayer } from './layer.tsx';
import { ChartLegend, ChartTable, ChartTooltip, type ChartTooltipProps } from './overlays.tsx';
import { ChartRoot } from './Root.tsx';
import { ChartArea, ChartBar, ChartBars, ChartLine, type ChartAreaProps, type ChartBarProps, type ChartLineProps } from './series.tsx';

/* JSX cannot carry the row type of the root down to its parts, so the plain parts take any key; `createChart` types them. */
// oxlint-disable-next-line typescript/no-explicit-any
type AnyRow = any;

export const Root = ChartRoot;
export const Grid = ChartGrid;
export const XAxis = ChartXAxis;
export const YAxis = ChartYAxis;
export const GroupAxis: (props: ChartGroupAxisProps<AnyRow>) => ReactNode = ChartGroupAxis;
export const Line: (props: ChartLineProps<AnyRow>) => ReactNode = ChartLine;
export const Area: (props: ChartAreaProps<AnyRow>) => ReactNode = ChartArea;
export const Bars = ChartBars;
export const Bar: (props: ChartBarProps<AnyRow>) => ReactNode = ChartBar;
export const Marker = ChartMarker;
export const Band = ChartBand;
export const Rule = ChartRule;
export const Tooltip: (props: ChartTooltipProps<AnyRow>) => ReactNode = ChartTooltip;
export const Legend = ChartLegend;
export const Table = ChartTable;
export const Layer = ChartLayer;
export const Group = ChartGroup;
