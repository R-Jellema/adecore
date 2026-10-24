# Shared cursor

Charts inside a `Chart.Group` share one cursor: the pointer over one draws the cursor in all of them, at the same moment. The group shares the x under the pointer, not an index, because the data sets need not line up. Each chart snaps to its own nearest bucket: errors per hour above, the latency every 20 minutes under it.

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

`Chart.Group` draws a `<div>` and takes `className` and `ref` (`ChartGroupProps`). A chart in it that controls its own cursor with `activeX` stays out of the group's.

A cursor across a whole screen, such as every chart on a dashboard, is the same group around all of them. To keep the cursor somewhere else, such as in a store of the app, control it on each chart with `activeX` and `onActiveXChange` instead.
