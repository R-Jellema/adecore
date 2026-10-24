# @adecore/charts

Charts in the theme of `@adecore/ui`: a series over time or per category as lines, areas and columns, a sparkline for a row or a tile, and a [heatmap](/charts/heatmap) of rows by columns. A chart takes its width from its container, draws on whole pixels, and is one stop for the keyboard that a screen reader reads bucket by bucket. `d3-scale` and `d3-shape` do the math; the package draws everything itself.

```tsx
import { Chart, Heatmap, Sparkline, createChart, useChart } from '@adecore/charts';
```

<Demo src="charts/errors-per-hour" />

## Install

`@adecore/ui`, React 19, `i18next` and `react-i18next` are peer dependencies. The package draws with the utilities of the theme, so let Tailwind scan it next to `@adecore/ui`:

```css
@import "tailwindcss";
@import "@adecore/ui/theme.css";
@source "../node_modules/@adecore/ui/dist";
@source "../node_modules/@adecore/charts/dist";
```

The words ("Show values", "Total", "No data" and the keyboard hint) live in a `charts` namespace in English and Dutch. Add them to the app's i18next next to its own namespaces:

```ts
import { CHARTS_NAMESPACE, CHARTS_RESOURCES } from '@adecore/charts';

for (const [language, words] of Object.entries(CHARTS_RESOURCES)) {
    i18n.addResourceBundle(language, CHARTS_NAMESPACE, words);
}
```

## How a chart is built

A chart is a compound component, like `Menu` and `Dialog` in `@adecore/ui`. `Chart.Root` owns the data, the scales, the cursor and the keyboard; each part inside it draws one layer, in the order of the children. The parts in svg draw into one `<svg>`, so put the grid first, then bands, series and markers. `Chart.Tooltip`, `Chart.Legend` and `Chart.Table` are HTML and go to their own places around the plot whatever their order.

| Part | Draws |
| --- | --- |
| [`Chart.Root`](/charts/series#chart-root) | The box. Its width follows the container; its height is fixed. |
| [`Chart.Grid`](/charts/series#grid-and-axes) | Gridlines on the ticks of the value axis, or of the x axis, or both. |
| [`Chart.XAxis`, `Chart.YAxis`](/charts/series#grid-and-axes) | Ticks and labels. The y axis measures its widest label. |
| [`Chart.GroupAxis`](/charts/columns#groups) | A second row of labels, one per group of columns. |
| [`Chart.Line`, `Chart.Area`](/charts/series#lines-and-areas) | A line, and a line with its area filled. |
| [`Chart.Bars`, `Chart.Bar`](/charts/columns) | Columns, side by side or stacked. |
| [`Chart.Marker`, `Chart.Band`](/charts/series#markers-and-bands) | A moment and a range, named in the tooltip. |
| [`Chart.Rule`](/charts/series#rules) | A line at a value, such as a reference, above the series. |
| [`Chart.Tooltip`](/charts/series#tooltip-legend-and-table) | The card at the cursor. |
| [`Chart.Legend`](/charts/series#tooltip-legend-and-table) | The series with their color. |
| [`Chart.Table`](/charts/series#tooltip-legend-and-table) | A toggle that shows every value as a table. |
| [`Chart.Layer`](/charts/use-chart) | A group in the plot for a drawing of the app's own. |
| [`Chart.Group`](/charts/shared-cursor) | Charts that share one cursor. |

The spans of a trace are no series: [`Timeline`](/charts/timeline) draws them as a tree of rows that folds, with a bar per span on one axis of durations.

## Colors

A series takes a `tone`: one of the status tones of the theme (`accent`, `error`, `needsYou`, `idle`, `running`, `muted`), or `{ color }` with a CSS value of the app's own, such as a variable. A series without a tone takes the next of `--chart-1` to `--chart-6`, the [chart series of the theme](/ui/guide/theme#chart-series), in the order of the children. Colors go through `style`, so they follow the theme.

## Types

JSX cannot check `value="errors"` against the row type of the root. `createChart<Row>()` returns the same parts with `x`, `group` and `value` typed as keys of `Row`, or as accessors of it. The type is `TypedChart`. Nothing is created: it is `Chart` under another type.

```tsx
const UsageChart = createChart<UsageDay>();

<UsageChart.Root data={days} x="day" label="Tokens per day">
    <UsageChart.Bar value="input" label="Input" />
</UsageChart.Root>
```

The plain `Chart` takes any key, and says in the console outside production when the first row has no such key.

## Keyboard and screen reader

The plot is one tab stop, a `group` with the role description "chart" and `label` as its name.

| Key | Moves the cursor |
| --- | --- |
| Arrow Left, Arrow Right | To the previous or the next bucket |
| Home, End | To the first or the last bucket |
| Page Up, Page Down | To the first bucket of the previous or the next group |
| Escape | Clears it |
| Enter, Space | Picks the bucket, with `onActivate` |

A polite live region reads each bucket the keyboard moves to: the group, the x, then every series ("14:00, Errors 12, Warnings 3"). With `onActivate` every bucket is a button with the same words as its name, reached as the active descendant, and the live region stays quiet so nothing is read twice. `Chart.Table` makes every value readable without moving the cursor at all.

## Empty and loading

A chart without data says "No data" in the plot. A chart fetches nothing, so loading stays with the app.
