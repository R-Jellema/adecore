# Timeline

The spans of a trace on one axis of time: a tree of rows that folds, a bar per span colored by what it waits on, the time each kind takes, moments such as errors on the axis, and the details of the selected span under its row. An order request with its queries, a service that calls a tax API, and a payment check that times out:

<Demo src="charts/trace-waterfall" />

```tsx
import { Timeline, type TimelineKind } from '@adecore/charts';

const KINDS: TimelineKind[] = [
    { id: 'db', label: 'Database' },
    { id: 'http', label: 'Network' },
    { id: 'code', label: 'Code' }
];

<Timeline.Root data={spans} kinds={KINDS} label="Spans of GET /api/orders/1842" value={selected} onValueChange={setSelected}>
    <Timeline.Legend />
    <Timeline.Axis heading="Span">
        {errors.map((error) => (
            <Timeline.Moment key={error.id} at={error.at} label={error.title} />
        ))}
    </Timeline.Axis>
    <Timeline.Rows
        label={(span: TraceSpan) => (
            <>
                <span className="shrink-0 text-xs text-text-muted">{span.op}</span>
                <span className="min-w-0 truncate font-mono text-code text-text">{span.label}</span>
            </>
        )}
        detail={(span: TraceSpan) => <SpanDetail span={span} />}
    />
</Timeline.Root>
```

A timeline is no `Chart.Root`: its rows are HTML, its height follows the rows, and the keyboard moves through spans rather than buckets. It sits flush in a panel, with its own 16px at either side, so a row's background runs from edge to edge. Below 576px of width, the bar of a row goes under its label.

## Spans

Each row of `data` is a `TimelineSpan`. The app keeps its own fields on it, and the render props of `Timeline.Rows` hand the app's type back when their parameter names it.

| Field | Type | |
| --- | --- | --- |
| `id` | `string` | Required. |
| `parent` | `string \| null` | The span it is part of. Null, or an id that is not in `data`, makes it a root. |
| `label` | `string` | Required. The name a screen reader reads, and what the row shows without a `label` render prop. |
| `start`, `duration` | `number` | Required. Milliseconds, on the same clock as every other span and moment. |
| `kind` | `string` | The id of one of `kinds`. |
| `tone` | `ChartColor` | Stands in for the color of its kind, such as `'error'` for a span that failed. |

The rows follow the tree: every span after its parent, and siblings by start. A span in a parent cycle starts a tree of its own.

## Timeline.Root

The axis runs from the earliest start to the latest end. `kinds` lists what a span can wait on, as `TimelineKind`s (`id`, `label`, `tone`); a kind without a tone takes the next chart color, and a span without a kind the accent.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `data` | `readonly Span[]` | | Required. |
| `label` | `string` | | Required. The name of the tree for a screen reader. |
| `kinds` | `readonly TimelineKind[]` | `[]` | |
| `value`, `defaultValue`, `onValueChange` | `string \| null` | `null` | The selected span, which shows its detail. Selecting it again clears it. |
| `expanded`, `defaultExpanded`, `onExpandedChange` | `readonly string[]` | every span with children | The spans that show their children. |
| `format` | `(ms: number) => string` | `formatPreciseDuration` | Writes every duration. The default of `@adecore/ui/format` writes `0.4 ms`, `123 ms` and `1.42 s`, and from a minute on as `formatDuration` does. |
| `ticks` | `number` | `5` | The most steps on the axis. |
| `className`, `ref` | | | On the outer box. |

`TimelineRootProps` are the props.

## Legend, axis and moments

`Timeline.Legend` writes each kind with its color and the time its spans take together. The roots are left out, as they cover the whole trace, and so is a kind without time.

`Timeline.Axis` writes `heading` over the labels and the ticks over the bars. The ticks are round steps of 1, 2 or 5 from zero; `durationTicks(total, count)` returns them, for an axis of durations of the app's own, such as a `linear` `Chart.Root` with an `XAxis` that takes them.

`Timeline.Moment` goes inside the axis: a diamond at `at`, in the `error` tone unless `tone` says otherwise, with a tooltip that names it and its offset from the start ("SHOP-212 Payment status timed out at +394 ms"). A moment before the first span or after the last stands at the end of the axis.

`TimelineLegendProps`, `TimelineAxisProps` and `TimelineMomentProps` are the props.

## Timeline.Rows

A row per span that is not folded away: the guides of its depth, a button that folds it, a swatch in its color, its label, and its bar with the duration inside, or beside it on the side with room when the bar is narrow. A folded row says how many spans hang directly under it.

| Prop | Type | |
| --- | --- | --- |
| `label` | `(span, row) => ReactNode` | What the row shows after its swatch; the span's `label` by default. `row` is a `TimelineRowState`: `depth`, `children`, `expanded` and the `color` of its bar. |
| `detail` | `(span) => ReactNode` | What the selected row shows under it, in a sunken box across both columns. A press inside it does not clear the selection. |
| `className`, `ref` | | On the tree. |

`TimelineRowsProps` are the props.

## Keyboard and screen reader

The rows are a `tree` with one tab stop, like `Tree` in `@adecore/ui`. Every row is a `treeitem` with its level, its place among its siblings, whether it is open and whether it is selected. Its name says its label, kind, start and duration ("SELECT orders, Database, starts at +12 ms, takes 40 ms"), and the detail of the selected row is its description.

| Key | |
| --- | --- |
| Up, Down | The previous or the next row. |
| Home, End | The first or the last row. |
| Right | Opens a folded row, or moves into an open one. |
| Left | Folds an open row, or moves to the parent. |
| Enter, Space | Selects the row, or clears the selection on the selected one. |

Folding a row with the focus somewhere under it hands the tab stop to that row. The moments are each a stop of their own, so their tooltip opens on focus.
