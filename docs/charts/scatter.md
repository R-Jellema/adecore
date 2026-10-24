# Scatter and series legend

With `rows="points"` a `Chart.Root` draws a scatter: every row is a point of its own at its x and its value, `group` puts the points in series, and a `Chart.Line` connects the points of each series in the order of the data. The cursor, the keyboard and `onActivate` work per point instead of per bucket. Models by intelligence against what a task costs, on a log axis, with the frontier of the best value, a label with a mark at the end of each line, a legend with search and groups beside it, and one point picked:

<Demo src="charts/models-by-cost" />

```tsx
const CostChart = createChart<ModelCost>();

<CostChart.Root
    data={points.filter((point) => !hidden.includes(point.model))}
    rows="points"
    x="cost"
    xScale="log"
    rowKey="key"
    rowLabel="effort"
    group="model"
    y={{ step: 10 }}
    label="Intelligence against cost per task"
    height={320}
    marginTop={34}
    selected={picked}
    onActivate={pick}
    dimmed={(row) => highlighted !== null && row.model !== highlighted}
>
    <CostChart.Grid dashed />
    <CostChart.YAxis title="Intelligence" />
    <CostChart.XAxis title="Cost per task" format={formatCost} />
    <CostChart.Frontier />
    <CostChart.Line value="score" label="Intelligence" tone={(row) => ({ color: modelColor(row.model) })} />
    <CostChart.Point value="score" label="Intelligence" tone={(row) => ({ color: modelColor(row.model) })} />
    <CostChart.EndLabels>
        {(series) => (
            <>
                <LabMark lab={series.rows[0].lab} />
                <span className="truncate">{series.label}</span>
            </>
        )}
    </CostChart.EndLabels>
</CostChart.Root>;
```

## Points

`rows` takes a `ChartRows`: `'buckets'` (the default) or `'points'`. On a point chart:

- Each row stands at its x and the value of the first `Chart.Point` or `Chart.Line`. A row whose x or value is missing is a gap: it gets no point and breaks its line, so a measurement that is not there is never drawn as a straight line between its neighbors.
- `group` puts the rows in series, in the order a key first appears, and `groupLabel` names them. Without `group` all points are one series.
- `rowKey` is the key of a row for `selected`, `activeX` and `onActiveXChange`, its index by default. `rowLabel` names a point beside its series, such as the effort of a model.
- A linear value axis covers the points and leaves zero out, since a point needs no ground. `step: 10` in `y` puts a tick every 10, with the ends rounded out to it, on a column chart too.
- `xScale` is `'linear'`, `'log'` or `'time'`. `xOptions` (a `ChartXOptions`) fixes the ends of the x axis: `{ min: 0 }` lets a linear cost start at nothing. A `log` axis runs over whole decades and ticks on each of them; where they do not fit, it keeps both ends and every other decade between them.

`Chart.Point` draws a dot per point. Without a `tone` each series takes the next chart color; `tone` also takes a function of the row, as on a column. The point under the cursor and every picked point grow, a picked point gets a ring, and so does the point the keyboard is on. `Chart.Line` takes the same function of the row, and colors each series by its first row. The props are `ChartPointProps`.

`dimmed` dims a point to 25%. A series whose points are all dimmed dims its line and its end label too, so an app brings one series forward by dimming the others, as the demo does while the pointer is on a name in the legend.

## Cursor, keyboard and picks

The pointer takes the nearest point within 16px, and leaving it clears the cursor. Dashed guides run from the point to both axes, with its x and its value written on the axes over their ticks; every picked point keeps its guides. `onActiveXChange` hears the key of the point, or `null`.

The plot stays one stop for the keyboard. Left and Right move along a series, Up and Down to the same place in the previous or the next series, Home and End to the ends of the series, and Escape clears. A point is read as its series, its label, its x under the title of the x axis and its value: "Atlas 5, high, Cost per task $0.74, Intelligence 71". A point and a line with the same label are read once.

With `onActivate` every point is a `role="button"` with `aria-pressed`, reached through `aria-activedescendant`: Enter, Space and a click call it. What a pick means, such as the reference of a comparison, stays with the app; `selected` takes the keys it picked.

`Chart.Tooltip` works per point as well, with the series and the label of the point on top and its x under the title of the axis. `Chart.Legend` lists the series of the groups with their color. `Chart.Table` gives the label of a point its own column next to its x, and leaves out a row without an x or a value, as the chart draws no point for it.

## Frontier

`Chart.Frontier` draws a wide soft band through the points no other point beats on both axes: none is at least as good on x and on value, and better on one of them. By default a lower x and a higher value are better, as with a cost and a score; `lowerX={false}` turns the x around for a speed, `higherY={false}` the value for a time. `width` is the width of the band in pixels (14), and `tone` its color, `--border` by default, which is an alpha over what lies behind it. Put it before the lines, so it stays under them. The props are `ChartFrontierProps`.

## End labels

`Chart.EndLabels` writes a label right of the plot at the last point of each series, with a thin line in the color of the series back to its point. Labels that would come nearer than 24px push apart, up and down, and stay inside the plot. The plot gives up `width` pixels on the right for them: 118, or 156 in a chart wider than 750px.

Its children get a `ChartPointSeries` (`key`, `label`, `rows` and `color`) and return what the label holds, such as a logo and a name. The label is HTML and takes the color of the series as `currentColor`. Without children it writes the label of the series. The props are `ChartEndLabelsProps`.

## Series legend

`SeriesLegend` lists many series beside a chart: a search, groups that turn on or off as a whole, a toggle per series and a highlight while the pointer or the focus is on one. It needs no `Chart.Root` around it, so it fits a sidebar. It only reports: `hidden` and `onHiddenChange` hold the keys that are off, `highlighted` and `onHighlightedChange` the one the pointer is on. What turning a series off means, such as leaving its rows out of `data`, stays with the app.

```tsx
<SeriesLegend
    label="Models"
    search="Find models"
    items={models.map((model) => ({ key: model.id, label: model.name, group: model.lab, color: model.color }))}
    groups={labs.map((lab) => ({ key: lab.id, label: lab.name }))}
    hidden={hidden}
    onHiddenChange={setHidden}
    highlighted={highlighted}
    onHighlightedChange={setHighlighted}
    mark={(item) => <LabLogo lab={item.group} />}
/>
```

| Prop                                 | Type                           | Default            |                                                                                                                                              |
| ------------------------------------ | ------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`, `label`                     | `SeriesLegendItem[]`, `string` |                    | Required. The series, and the name of the list for a screen reader.                                                                          |
| `hidden`, `onHiddenChange`           | `string[]`                     |                    | Required. The keys of the series that are off.                                                                                               |
| `highlighted`, `onHighlightedChange` | `string \| null`               |                    | The series under the pointer or the focus. A series that is off is never highlighted.                                                        |
| `groups`                             | `SeriesLegendGroup[]`          |                    | The groups in their order, each with a button that turns its series on or off together. An item whose `group` is not among them is left out. |
| `mark`                               | `(item) => ReactNode`          |                    | Drawn before the name in the color of the item.                                                                                              |
| `search`                             | `string \| false`              | "Search"           | The placeholder and the name of the search field; `false` leaves it out.                                                                     |
| `query`, `onQueryChange`             | `string`                       |                    | Controls the search, so an app can clear it with the rest of its filters.                                                                    |
| `empty`                              | `string`                       | "Nothing matches." | What the list says when the search finds nothing.                                                                                            |
| `size`                               | `'sm' \| 'md'`                 | `'sm'`             | The height of a row: 28px, or 36px for a touch screen.                                                                                       |

A `SeriesLegendItem` has a `key`, a `label`, and optionally a `group`, a `color`, `disabled` for a series with nothing to show, and a `status` that says why a series shows less than it could ("Turned off"), under its name and in its hint. The props are `SeriesLegendProps`.
