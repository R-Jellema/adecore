# Columns and groups

`Chart.Bar` draws a column per bucket, on a `band` scale. Tokens per day, input and output stacked, with the total in the tooltip:

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

Columns stand on whole pixels. A column is never narrower than 2px, and keeps at least 1px of air to the next bucket. While the cursor is on a bucket, the columns of the others dim.

`tone` takes a tone, `{ color }`, or a function of the row for a color per column: `tone={(row) => runTone(row.status)}`. `opacity` is a function of the row and its index in its group, for columns that grow stronger inside one. The props are `ChartBarsProps` and `ChartBarProps`, and `ChartBarTone` is the type of `tone`.

## Groups

`group` on the root puts the buckets into groups by a key, in the order of `data`, with a gap between them. Each row is one bucket, so a group holds as many columns as it has rows. Scores per model and effort, two to four efforts per model:

<Demo src="charts/scores-by-model" />

```tsx
const ScoreChart = createChart<ModelScore>();

<ScoreChart.Root
    data={scores}
    x="key"
    group="model"
    label="Scores per model and effort"
    y={{ min: 0, max: 80 }}
    minBucketWidth={28}
    selected={picked}
    onActivate={toggle}
>
    <ScoreChart.Grid />
    <ScoreChart.YAxis ticks={4} />
    <ScoreChart.XAxis format={(key) => effortOf(key)} />
    <ScoreChart.Bar
        value="score"
        label="Intelligence"
        tone={(row) => ({ color: labColor(row.lab) })}
        opacity={(row, indexInGroup) => 0.55 + indexInGroup * 0.15}
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

`Chart.GroupAxis` is a second row of labels under the x axis, one per group and centered under it. It is HTML, so a mark or a logo fits. Its `children` is a function of the group (`ChartBucketGroup`: its `key`, its `rows` and the index of its `first` and `last` bucket); the props are `ChartGroupAxisProps`.

The arrow keys keep moving column by column, across the edges of the groups, and Page Up and Page Down jump to the first column of the previous or the next group. The live region names the group first ("Atlas 5, high, Intelligence 71").

`minBucketWidth` is the narrowest a bucket may be. Below it the plot grows wider than its box and scrolls sideways, while the y axis stays in place.

## Picking columns

With `onActivate`, the buckets become pressable: Enter, Space and a click call it with the row. The buckets in `selected` stay highlighted, are pressed for a screen reader, and the other columns dim. What a pick means, such as a reference to compare against, stays with the app. `dimmed` takes a function of the row and dims every column the app does not want in focus, such as the other models while one is highlighted.

## A ranked row

Without `group`, every column stands in one row. `angle={-40}` on `Chart.XAxis` slants the labels, for long names under every column:

<Demo src="charts/scores-ranked" />

```tsx
<ScoreChart.Root data={ranked} x="key" label="Scores, ranked" y={{ min: 0, max: 80 }} height={280} minBucketWidth={24}>
    <ScoreChart.Grid />
    <ScoreChart.YAxis ticks={4} />
    <ScoreChart.XAxis angle={-40} format={(key) => nameOf(key)} />
    <ScoreChart.Bar value="score" label="Intelligence" tone={(row) => ({ color: labColor(row.lab) })} />
    <ScoreChart.Tooltip />
</ScoreChart.Root>
```

There are no value labels on top of the columns; the tooltip, the live region and the table carry the numbers. A drawing of the app's own can add them through [`Chart.Layer`](/charts/use-chart).
