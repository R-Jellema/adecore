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

Rows that are samples at a moment, not buckets that last a while, take `step={0}`: each point stands at its own x and the cursor takes the nearest sample. `xOptions` (`{ min, max }`, a `ChartXOptions`) fixes the ends of a time or linear axis, such as the last five minutes up to the newest sample, so the plot does not stretch while the first samples come in. Rows outside the ends are drawn past them; leave them out of `data`.

The value axis is `linear` or `log` (`yScale`). It covers every series, stacked ones at their top, starts at zero on a linear scale and rounds its ends out to a tick. `y` fixes the ends (`{ min, max }`), and `{ integer: true }` keeps the ticks of a count on whole numbers. `{ include: [1] }` makes the axis cover a value the data may not reach and still round out above it, so a share that stays near zero does not fill the plot; larger data still raises the top. `headroom` says what the top leaves above the highest value: up to the next tick (`'tick'`, the default, so a value on a tick touches the top), a whole step more when the value lands on a tick (`'step'`), or nothing (`'none'`), so the highest column fills the plot.

The width follows the container; `height` (200 by default) is the height of the plot and the x axis together.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `data` | `readonly Row[]` | | Required. One row per bucket. |
| `x` | `keyof Row \| (row, index) => ChartXInput` | | Required. |
| `label` | `string` | | Required. The name a screen reader reads, and the caption of the table. |
| `xScale` | `'band' \| 'time' \| 'linear'` | `'band'` | |
| `step` | `number` | | The length of a bucket on a time scale, in milliseconds. Set it when rows may be missing at the start, and for columns, which one row cannot draw without it. `0` for samples. |
| `xOptions` | `ChartXOptions` | | The ends of a time or linear x axis. |
| `yScale` | `'linear' \| 'log'` | `'linear'` | |
| `y` | `ChartYOptions` | `{}` | `min`, `max`, `include`, `integer`, `step` and `headroom`. |
| `height` | `number` | `200` | Pixels. |
| `margin` | `ChartMargin` | | Pixels around the plot, beside what the axes take. `top` is 8, for something drawn over the plot; `bottom` is 4; `left` and `right` are 6 on a time or linear scale without buckets, so the dot at the end of a line keeps its edge, and 0 otherwise. A chart that draws to its edges, such as a small line in a panel, sets them to 0. |
| `activeX`, `onActiveXChange` | `ChartX \| null` | | The cursor, controlled. Leaving the chart calls `onActiveXChange(null)`; the app decides whether the cursor goes. |
| `group`, `groupLabel`, `groupGap`, `minBucketWidth` | | | Groups of columns, see [Columns and groups](/charts/columns). |
| `selected`, `onActivate`, `dimmed` | | | Columns a person picks, see [Columns and groups](/charts/columns#picking-columns). |
| `className`, `ref` | | | On the outer box. |

A `ChartX` is a number (a moment in milliseconds) or the key of a category; a `ChartXInput` may also be a `Date`. `ChartXScale`, `ChartYScale`, `ChartYOptions`, `ChartAccessor` and `ChartRootProps` are exported as types.

## Grid and axes

`Chart.Grid` draws a line on every tick of the value axis in `--border-soft`, with the ground in `--border-strong`, so columns and areas stand on a line that reads. `axis` takes `'y'` (the default), `'x'` or `'both'`. `dashed` dashes every line but the ground, all of them in `--border` so the dashes still read as a line. `lines="ground"` draws the ground alone, for columns that carry their value over them and need no scale.

`Chart.YAxis` writes the ticks beside the plot, on the `left` or the `right` (`side`). It measures its widest label and gives the plot the rest of the width. `Chart.XAxis` writes them under it. On a time scale the labels are the clock within a day, the day once the ticks are a day apart, and both in between, from `@adecore/ui/format`. Labels that would overlap thin out, and a label that would hang past the end of the chart is left out, except on a tick at an end of the axis, such as the last decade of a `log` scale, which moves inward.

`format` writes a value or an x. The format of an axis is also how the tooltip, the live region and the table write it. A `Chart.YAxis` on each side keeps its own `format`, `ticks` and `title` over the one value scale. The tooltip writes a value in the `format` of the left one and the scale takes its `ticks`, or those of the right one where the left has none. `ticks` asks for a number of ticks. `title` names what an axis measures: on `Chart.YAxis` it stands above the plot where the axis starts, such as a unit ("Index points, higher is better"), and the plot moves down to make room; on `Chart.XAxis` it stands centered under the labels, and a `log` scale adds "logarithmic" to it. A second `Chart.XAxis` writes its row under the first, and `thin={false}` keeps every label of a band scale; see [a ranked row](/charts/columns#a-ranked-row). `ChartGridProps`, `ChartXAxisProps` and `ChartYAxisProps` are the props.

## Lines and areas

`Chart.Line` draws a line through `value`. A missing value (`null`, or anything that is no finite number) breaks the line, and a value with no neighbor gets a dot, so it does not vanish. `curve` is `linear`, `monotone` or `step` (`ChartCurve`); `dashed` dashes the line and `dots` puts a dot on every value. `width` is 2 pixels, or 1 for a small chart beside others.

`Chart.Area` is a line with its area filled down to zero. With `stack` it stands on the stacked areas before it instead, and the value axis covers the top of the pile. Its fill fades toward the ground; `fill="flat"` tints it evenly at 28%, as a stacked area always is. `width` sets the line along its top, and `0` leaves the area alone, such as a share under a line of the whole.

`icon` takes a Lucide icon, as `Icon` of `@adecore/ui` does, and draws it in the color of the series in place of its swatch, in the legend and the tooltip; `Chart.Bar` takes one too. The props are `ChartLineProps` and `ChartAreaProps`; `tone` is a `ChartColor`, a `ChartTone` or `{ color }`.

## Markers and bands

`Chart.Marker` draws a dashed vertical line at a moment, `at`, with a dot on top. Its `label` is named in the tooltip of the bucket the moment falls in, so a deploy at 14:37 shows under the bucket of 14:00. `Chart.Band` shades a range from `from` to `to` with a hatch, named in the tooltip of every bucket it touches. Both are muted unless they get a `tone`. On a band scale `at`, `from` and `to` are keys of buckets; a moment between two buckets needs a time scale, which takes [columns](/charts/columns#columns-over-time) too. The props are `ChartMarkerProps` and `ChartBandProps`.

## Rules

`Chart.Rule` draws a horizontal line across the plot at `value`, such as a budget or a column picked as a reference, with its `label` and the value at its right end ("A · 71"). It draws above the series whatever its place among the children, and the value axis covers it, also where the data stays below it. `tone` colors it (muted by default) and `dashed` dashes it.

A rule holds for every bucket, so the tooltip does not repeat it; a screen reader hears it once, with the description of the chart. The props are `ChartRuleProps`.

```tsx
<Chart.Rule value={300} label="Budget" tone="error" dashed />
```

## Tooltip, legend and table

On a time scale the cursor takes the bucket under the pointer, the same bucket a marker there is named in; where a row is missing it shows nothing. On a linear scale it snaps to the nearest point. On a time or linear scale it draws a line with a dot on every series; on a band scale it lights the bucket. Leaving the chart clears it; with `activeX` controlled it calls `onActiveXChange(null)` instead. `onActiveXChange` hears the x of a bucket, once each time the pointer enters another one, and `null` over a missing row.

`Chart.Tooltip` is the card at the cursor: the x of the bucket, a row per series (with `-` where the series has no value), then its markers and bands. It hangs on the side of the cursor with the most room. `total` adds the sum of the series as "Total", or under the name it is given (`total="Runs"`), and `format` writes the values of the card. `children` takes the bucket (`ChartBucket`, with a `ChartBucketValue` per series) and draws the card's contents instead.

`Chart.Legend` lists the series with their color, in the order of the children, above the plot. `Chart.Table` is a "Show values" toggle under it with the data as a table, which a screen reader reads also while it is closed. The props are `ChartTooltipProps`, `ChartLegendProps` and `ChartTableProps`.

## Durations and runs of an endpoint

Two charts of one endpoint over a day in buckets of 30 minutes, with the two deploys that slowed it down and fixed it again. The durations are lines with a format of the app's own on the axis and in the tooltip:

<Demo src="charts/transaction-duration" />

```tsx
<Chart.Root data={buckets} x="at" xScale="time" step={HALF_HOUR} label="p50 and p95 duration over time">
    <Chart.Grid />
    <Chart.XAxis />
    <Chart.YAxis format={formatSpan} />
    <Chart.Line value="p50" label="p50" />
    <Chart.Line value="p95" label="p95" />
    {deploys.map((deploy) => (
        <Chart.Marker key={deploy.version} at={deploy.at} label={`Deploy ${deploy.version}`} tone="accent" />
    ))}
    <Chart.Tooltip />
    <Chart.Legend />
</Chart.Root>
```

The runs are stacked columns on whole numbers, the failed ones in the error tone, with their sum named in the tooltip:

<Demo src="charts/transaction-runs" />

```tsx
<Chart.Root data={buckets} x="at" xScale="time" step={HALF_HOUR} y={{ integer: true }} label="Runs and failures over time">
    <Chart.Grid />
    <Chart.XAxis />
    <Chart.YAxis />
    <Chart.Bars stack>
        <Chart.Bar value="succeeded" label="Succeeded" />
        <Chart.Bar value="failed" label="Failed" tone="error" />
    </Chart.Bars>
    {deploys.map((deploy) => (
        <Chart.Marker key={deploy.version} at={deploy.at} label={`Deploy ${deploy.version}`} tone="accent" />
    ))}
    <Chart.Tooltip total="Runs" />
    <Chart.Legend />
</Chart.Root>
```

Put both in a [`Chart.Group`](/charts/shared-cursor) and the cursor follows the pointer through both.
