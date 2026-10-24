# Series chart

Values per bucket on a shared x axis: a moment, a number or a category. Errors and warnings per hour over a day, with a deploy and a stretch the collector was down:

<Demo src="charts/errors-per-hour" />

```tsx
<Chart.Root data={buckets} x="at" xScale="time" y={{ integer: true }} label="Events per hour" height={220}>
    <Chart.Grid />
    <Chart.Band from={gap.start} to={gap.end} label="No data from the collector" />
    <Chart.XAxis />
    <Chart.YAxis />
    <Chart.Area value="errors" label="Errors" tone="error" />
    <Chart.Line value="warnings" label="Warnings" tone="needsYou" />
    <Chart.Marker at={deploy.at} label={`Deploy ${deploy.version}`} tone="accent" />
    <Chart.Tooltip />
    <Chart.Legend />
    <Chart.Table />
</Chart.Root>
```

## Chart.Root

Each row of `data` is one bucket. `x` names its position, as a key of the row or a function of it. `xScale` says what the position is:

- `band` (the default): a category per row, such as a day or a model, with the buckets side by side.
- `time`: a moment, as a `Date` or in milliseconds. The rows run from the earliest to the latest. Each row is a bucket that starts at its x and lasts one `step`, the smallest distance between two rows unless the root gets one; its point stands in the middle of it, where a column would. Columns stand on this scale and on `band`, not on `linear`.
- `linear`: a number, the rows from low to high.

The value axis is `linear` or `log` (`yScale`). It covers every series, stacked ones at their top, starts at zero on a linear scale and rounds its ends out to a tick. `y` fixes the ends (`{ min, max }`), and `{ integer: true }` keeps the ticks of a count on whole numbers.

The width follows the container; `height` (200 by default) is the height of the plot and the x axis together.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `data` | `readonly Row[]` | | Required. One row per bucket. |
| `x` | `keyof Row \| (row, index) => ChartXInput` | | Required. |
| `label` | `string` | | Required. The name a screen reader reads, and the caption of the table. |
| `xScale` | `'band' \| 'time' \| 'linear'` | `'band'` | |
| `step` | `number` | | The length of a bucket on a time scale, in milliseconds. Set it when rows may be missing at the start. |
| `yScale` | `'linear' \| 'log'` | `'linear'` | |
| `y` | `ChartYOptions` | `{}` | `min`, `max` and `integer`. |
| `height` | `number` | `200` | Pixels. |
| `activeX`, `onActiveXChange` | `ChartX \| null` | | The cursor, controlled. Leaving the chart calls `onActiveXChange(null)`; the app decides whether the cursor goes. |
| `group`, `minBucketWidth` | | | Groups of columns, see [Columns and groups](/charts/columns). |
| `selected`, `onActivate`, `dimmed` | | | Columns a person picks, see [Columns and groups](/charts/columns#picking-columns). |
| `className`, `ref` | | | On the outer box. |

A `ChartX` is a number (a moment in milliseconds) or the key of a category; a `ChartXInput` may also be a `Date`. `ChartXScale`, `ChartYScale`, `ChartYOptions`, `ChartAccessor` and `ChartRootProps` are exported as types.

## Grid and axes

`Chart.Grid` draws a line on every tick of the value axis in `--border-soft`, with the ground in `--border`. `axis` takes `'y'` (the default), `'x'` or `'both'`.

`Chart.YAxis` writes the ticks beside the plot, on the `left` or the `right` (`side`). It measures its widest label and gives the plot the rest of the width. `Chart.XAxis` writes them under it. On a time scale the labels are the clock within a day, the day once the ticks are a day apart, and both in between, from `@adecore/ui/format`. Labels that would overlap thin out, and a label that would hang past the end of the chart is left out.

`format` writes a value or an x. The format of an axis is also how the tooltip, the live region and the table write it. `ticks` asks for a number of ticks. `ChartGridProps`, `ChartXAxisProps` and `ChartYAxisProps` are the props.

## Lines and areas

`Chart.Line` draws a line through `value`. A missing value (`null`, or anything that is no finite number) breaks the line, and a value with no neighbor gets a dot, so it does not vanish. `curve` is `linear`, `monotone` or `step` (`ChartCurve`); `dashed` dashes the line and `dots` puts a dot on every value.

`Chart.Area` is a line with its area filled down to zero. With `stack` it stands on the stacked areas before it instead, and the value axis covers the top of the pile.

The props are `ChartLineProps` and `ChartAreaProps`; `tone` is a `ChartColor`, a `ChartTone` or `{ color }`.

## Markers and bands

`Chart.Marker` draws a dashed vertical line at a moment, `at`, with a dot on top. Its `label` is named in the tooltip of the bucket the moment falls in, so a deploy at 14:37 shows under the bucket of 14:00. `Chart.Band` shades a range from `from` to `to` with a hatch, named in the tooltip of every bucket it touches. Both are muted unless they get a `tone`. On a band scale `at`, `from` and `to` are keys of buckets; a moment between two buckets needs a time scale, which takes [columns](/charts/columns#columns-over-time) too. The props are `ChartMarkerProps` and `ChartBandProps`.

## Tooltip, legend and table

On a time scale the cursor takes the bucket under the pointer, the same bucket a marker there is named in; where a row is missing it shows nothing. On a linear scale it snaps to the nearest point. On a time or linear scale it draws a line with a dot on every series; on a band scale it lights the bucket. Leaving the chart clears it; with `activeX` controlled it calls `onActiveXChange(null)` instead.

`Chart.Tooltip` is the card at the cursor: the x of the bucket, a row per series, then its markers and bands. It hangs on the side of the cursor with the most room. `total` adds the sum of the series, and `format` writes the values of the card. `children` takes the bucket (`ChartBucket`, with a `ChartBucketValue` per series) and draws the card's contents instead.

`Chart.Legend` lists the series with their color, in the order of the children, above the plot. `Chart.Table` is a "Show values" toggle under it with the data as a table, which a screen reader reads also while it is closed. The props are `ChartTooltipProps`, `ChartLegendProps` and `ChartTableProps`.
