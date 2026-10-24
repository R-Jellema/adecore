# Columns and groups

`Chart.Bar` draws a column per bucket, on a `band` scale or on a `time` scale. Tokens per day, input and output stacked, with the total in the tooltip:

<Demo src="charts/tokens-per-day" />

```tsx
const UsageChart = createChart<TokenDay>();

<UsageChart.Root data={days} x="day" label="Tokens per day" height={220}>
    <UsageChart.Grid />
    <UsageChart.YAxis format={formatTokens} />
    <UsageChart.XAxis format={(day) => formatDay(day as number)} />
    <UsageChart.Bars stack>
        <UsageChart.Bar value="input" label="Input" />
        <UsageChart.Bar value="output" label="Output" />
    </UsageChart.Bars>
    <UsageChart.Tooltip total />
    <UsageChart.Legend />
</UsageChart.Root>
```

## Bars and Bar

`Chart.Bars` holds the `Chart.Bar` that share the width of a bucket. Without `stack` they stand side by side, with `stack` they pile up in the order of the children, with 1px of ground between two segments. A `Chart.Bar` outside `Chart.Bars` stands beside the others outside it.

Columns stand on whole pixels. A column is never narrower than 2px, and by default takes 72% of its bucket, at most 56px, which leaves at least 1px of air to the next bucket. While the cursor is on a bucket, the columns of the others dim to 55%.

`tone` takes a tone, `{ color }`, or a function of the row for a color per column: `tone={(row) => runTone(row.status)}`. `opacity` is a function of the row, its index in its group and the size of the group, for columns that grow stronger inside one. The props are `ChartBarsProps` and `ChartBarProps`, and `ChartBarTone` is the type of `tone`.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value`, `label` | | | Required. What the column reads, and its name in the tooltip, the legend and the table. |
| `tone` | `ChartBarTone` | the next chart color | |
| `opacity` | `(row, indexInGroup, groupSize) => number` | | |
| `hoverOpacity` | `number` | `0.55` | The other columns while the cursor is on a bucket; `1` leaves them be. |
| `dimOpacity` | `number` | `0.4` | A column the root dims, or one not picked while another is. Below 0.4 a column that is already light nearly vanishes in the dark theme. |
| `columnWidth` | `(bucket: number) => number` | | The pixels the columns of a bucket take together, at most the bucket. |
| `radius` | `number` | `2` | The corners of a column that stands alone, at most a quarter of its width. |

## Columns over time

On a `time` scale each bucket lasts one `step` from its x, and its columns stand in that slot. A marker or a band at any moment then lands where it happened, between the columns or across them, and a row that is missing leaves its slot empty:

<Demo src="charts/columns-over-time" />

```tsx
<Chart.Root data={buckets} x="at" xScale="time" step={HOUR} y={{ integer: true }} label="Events per hour" height={220}>
    <Chart.Grid />
    <Chart.Band from={gap.start} to={gap.end} label="No data from the collector" />
    <Chart.XAxis />
    <Chart.YAxis />
    <Chart.Bars stack>
        <Chart.Bar value="errors" label="Errors" tone="error" />
        <Chart.Bar value="warnings" label="Warnings" tone="needsYou" />
    </Chart.Bars>
    <Chart.Marker at={deploy.at} label={`Deploy ${deploy.version}`} tone="accent" />
    <Chart.Tooltip total />
    <Chart.Legend />
</Chart.Root>
```

`step` defaults to the smallest distance between two rows; give it when the first rows may be missing. A `band` scale of days or hours draws the same columns, but there a marker needs the key of a bucket.

## Groups

`group` on the root puts the buckets into groups by a key, in the order of `data`, with a gap of `groupGap` pixels between them (16 by default) and half of one at both ends. Each row is one bucket, so a group holds as many columns as it has rows. Scores per model and effort, two to four efforts per model, on a dashed grid, with wider columns that stay as they are while the cursor is elsewhere:

<Demo src="charts/scores-by-model" />

```tsx
const ScoreChart = createChart<ModelScore>();

<ScoreChart.Root
    data={scores}
    x="key"
    group="model"
    groupGap={20}
    label="Scores per model and effort"
    y={{ min: 0, max: 80 }}
    minBucketWidth={28}
    selected={picked}
    onActivate={toggle}
>
    <ScoreChart.Grid dashed />
    <ScoreChart.YAxis ticks={4} />
    <ScoreChart.XAxis format={(key) => effortOf(key)} thin={false} />
    <ScoreChart.Bar
        value="score"
        label="Intelligence"
        tone={(row) => ({ color: labColor(row.lab) })}
        opacity={(row, indexInGroup, groupSize) => 0.6 + (indexInGroup / Math.max(groupSize - 1, 1)) * 0.4}
        hoverOpacity={1}
        columnWidth={(bucket) => Math.max(6, Math.min(44, Math.floor(bucket) - 4))}
        radius={3}
    />
    <ScoreChart.GroupAxis>
        {(group) => (
            <>
                <LabMark lab={group.rows[0].lab} />
                <span>{group.key}</span>
            </>
        )}
    </ScoreChart.GroupAxis>
    <ScoreChart.Tooltip />
</ScoreChart.Root>
```

`Chart.GroupAxis` is a second row of labels under the x axis, one per group and centered under it. It is HTML, so a mark or a logo fits. Its `children` is a function of the group (`ChartBucketGroup`: its `key`, its `label`, its `rows` and the index of its `first` and `last` bucket); the props are `ChartGroupAxisProps`.

The arrow keys keep moving column by column, across the edges of the groups, and Page Up and Page Down jump to the first column of the previous or the next group. The live region names the group first ("Atlas 5, high, Intelligence 71").

The key of a group is its identity, which need not be what a person reads, such as the id of a model. `groupLabel` on the root reads the name from the rows, as a key or a function: `groupLabel="modelName"`. The tooltip, the live region and the table read it, and `Chart.GroupAxis` hands it to its children as `label`.

`minBucketWidth` is the narrowest a bucket may be. Below it the plot grows wider than its box and scrolls sideways, while the y axis stays in place.

## Picking columns

With `onActivate`, the buckets become pressable: Enter, Space and a click call it with the row. The buckets in `selected` stay highlighted, are pressed for a screen reader, and the other columns dim. What a pick means, such as a reference to compare against, stays with the app. `dimmed` takes a function of the row and dims every column the app does not want in focus, such as the other models while one is highlighted.

## A ranked row

Without `group`, every column stands in one row. A second `Chart.XAxis` writes a row of labels under the first, and `angle={-40}` slants them, for long names under every column:

<Demo src="charts/scores-ranked" />

```tsx
<ScoreChart.Root data={ranked} x="key" label="Scores, ranked" y={{ min: 0, max: 80 }} height={300} minBucketWidth={28}>
    <ScoreChart.Grid />
    <ScoreChart.YAxis ticks={4} />
    <ScoreChart.XAxis format={(key) => effortOf(key)} thin={false} />
    <ScoreChart.XAxis angle={-40} format={(key) => nameOf(key)} />
    <ScoreChart.Bar value="score" label="Intelligence" tone={(row) => ({ color: labColor(row.lab) })} />
    <ScoreChart.Tooltip />
</ScoreChart.Root>
```

The rows stack in the order of the children. The tooltip, the live region and the table name a bucket by every row, the lowest first ("Atlas 5, high"). A row of a band scale leaves labels out where they would overlap; `thin={false}` writes one under every column.

There are no value labels on top of the columns; the tooltip, the live region and the table carry the numbers. A drawing of the app's own can add them through [`Chart.Layer`](/charts/use-chart).
