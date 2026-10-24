# Shared cursor

Charts inside a `Chart.Group` share one cursor: the pointer over one draws the cursor in all of them, at the same moment. The group shares the x under the pointer, not an index, because the data sets need not line up. Each chart takes its own bucket at that moment: errors per hour above, the latency every 20 minutes under it.

<Demo src="charts/shared-cursor" />

```tsx
<Chart.Group className="flex flex-col gap-6">
    <Chart.Root data={errors} x="at" xScale="time" label="Errors per hour" height={150}>
        <Chart.Grid />
        <Chart.YAxis />
        <Chart.Area value="errors" label="Errors" tone="error" />
        <Chart.Tooltip />
    </Chart.Root>
    <Chart.Root data={latency} x="at" xScale="time" label="Latency, p95" height={170}>
        <Chart.Grid />
        <Chart.XAxis />
        <Chart.YAxis format={(value) => `${value} ms`} />
        <Chart.Line value="p95" label="p95" curve="monotone" />
        <Chart.Tooltip format={(value) => `${value} ms`} />
    </Chart.Root>
</Chart.Group>
```

Only the chart under the pointer, or the one the keyboard moves in, shows its tooltip; the others draw the cursor without one.

The group also lines up the plots: the y axes take the width of the widest on each side, so the same moment stands at the same pixel in every chart. The two are apart: `shareCursor={false}` keeps a cursor per chart, and `alignAxes={false}` leaves each y axis at its own width.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `shareCursor` | `boolean` | `true` | One cursor for every chart inside. |
| `alignAxes` | `boolean` | `true` | The y axes take the width of the widest. |
| `className`, `ref` | | | On the `<div>` it draws. |

The props are `ChartGroupProps`. A chart in the group that controls its own cursor with `activeX` stays out of the group's.

A cursor across a whole screen, such as every chart on a dashboard, is the same group around all of them. To keep the cursor somewhere else, such as in a store of the app, control it on each chart with `activeX` and `onActiveXChange` instead.
