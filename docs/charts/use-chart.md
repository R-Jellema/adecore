# useChart

`useChart()` reads the chart around it: the plot, the scales, the data and the cursor. Together with `Chart.Layer`, a `<g>` in the plot, it lets an app draw on the same axes before the package has a part for it, such as a budget line, a frontier or value labels over columns.

<Demo src="charts/use-chart" />

```tsx
function Budget() {
    const { plot, y } = useChart();
    const pixel = y(300);
    if (pixel === null) {
        return null;
    }
    const top = Math.round(pixel) + 0.5;
    return <line x1={plot.left} x2={plot.right} y1={top} y2={top} stroke="currentColor" strokeDasharray="6 4" />;
}

<Chart.Root data={latency} x="at" xScale="time" y={{ min: 0, max: 400 }} label="Latency, p95, against its budget">
    <Chart.Line value="p95" label="p95" />
    <Chart.Layer>
        <Budget />
    </Chart.Layer>
</Chart.Root>
```

`useChart<Row>()` returns a `ChartApi`:

| Field | |
| --- | --- |
| `plot` | The plot as a `ChartRect` (`left`, `top`, `right`, `bottom`, `width`, `height`), in the coordinates `Chart.Layer` draws in. |
| `data` | The rows of the root. |
| `x(value)` | The pixel of an x: the center of its bucket on a band scale. `null` for an x the chart does not have. |
| `y(value)` | The pixel of a value, `null` for one a log scale cannot show. |
| `yTicks` | The ticks of the value axis. |
| `bandwidth` | The width of a bucket on a band scale, 0 on a continuous one. |
| `activeIndex`, `activeRow` | The bucket under the cursor, or `null`. |
| `setActiveX(x)` | Moves the cursor, or clears it with `null`. |

A pixel lands between two device pixels; round it, and add half a pixel for a line one pixel wide, so it stays sharp. A layer draws above the series in the order of the children. `Chart.Layer` takes `className` and `ref` (`ChartLayerProps`), and calling `useChart` outside a `Chart.Root` throws.
