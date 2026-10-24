# Heatmap

A grid of rows by columns, each cell shaded by its value: when something happens by weekday and hour, or how often it fails by suite and platform. The rows and the columns come from the app.

```tsx
import { Heatmap } from '@adecore/charts';
```

## By weekday and hour

<Demo src="charts/events-by-weekday" />

```tsx
const rows = days.map((at, day) => ({ key: day, label: formatWeekday(at, 'long'), short: formatWeekday(at) }));
const columns = hours.map((at, hour) => ({ key: hour, label: formatClock(at), short: hour % 6 === 0 ? formatHour(at) : null }));

<Heatmap rows={rows} columns={columns} values={counts} label="Error events per weekday and hour" valueLabel="Events" />
```

`values` holds a list per row, a value per column. Each row and column has a `key`, a `label` that the tooltip, the live region and the table read, and a `short` the axis writes in its place: `Mon` for Monday, or `null` to leave the axis blank there, as for every hour but each sixth. Write both with [`formatWeekday`, `formatHour` and `formatClock`](/ui/formatting/dates), so they follow the language and the region. The heatmap draws the days in the order given, so the app decides whether a week starts on Monday or on Sunday, and adds up its own counts in the reader's time zone.

## Any grid

Failed checks per suite and platform, in the error tone, four steps, taller cells and a "Show values" toggle. One suite does not run on one platform, so its cell has no value.

<Demo src="charts/failures-by-suite" />

```tsx
<Heatmap
    rows={suites}
    columns={platforms}
    values={failures}
    label="Failed checks per suite and platform, last 50 runs"
    valueLabel="Failed checks"
    tone="error"
    steps={4}
    cellHeight={28}
    table
/>
```

## Shades

A value falls into one of `steps` shades by its share of `max`, the highest value unless the app gives one. The shade is the color of `tone` mixed over the surface from 15% for the first step to 100% for the last, so the smallest count still stands apart from an empty cell. An empty cell, for a zero, a value below zero or a missing value (`null`), is `--surface-sunken`. The tooltip writes a missing value as `-` and the live region as "No data". Give two heatmaps the same `max` to compare them.

The legend under the grid shows the empty cell and every step between "Less" and "More". `legend={false}` leaves it out.

## Keyboard and screen reader

The grid is one tab stop, a `group` with the role description "heatmap" and `label` as its name. The cell under the pointer or the keyboard gets an outline and a card with its row, its column and its exact value.

| Key | Moves to |
| --- | --- |
| Arrow keys | The next cell in that direction |
| Home, End | The first or the last cell of the row |
| Control with Home or End | The first or the last cell of the grid |
| Escape | Nowhere: it clears the cell |

A polite live region reads each cell the keyboard moves to: "Monday, 09:00, Events 41". The values are also in a table for a screen reader; `table` adds a "Show values" toggle that shows it to everyone.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `rows`, `columns` | `readonly HeatmapAxisItem[]` | | Required. `{ key, label, short? }`. |
| `values` | `readonly (readonly (number \| null)[])[]` | | Required. By row, then by column. |
| `label` | `string` | | Required. The name of the heatmap. |
| `valueLabel` | `string` | | Required. What a value counts, such as "Events". |
| `tone` | `ChartColor` | `'accent'` | |
| `steps` | `number` | `5` | Shades besides the empty cell. |
| `max` | `number` | the highest value | The value of the last step. |
| `format` | `(value: number) => string` | `formatNumber` | Writes a value in the card, the live region and the table. |
| `cellHeight` | `number` | `16` | Pixels. The width of a cell follows the container. |
| `legend` | `boolean` | `true` | |
| `table` | `boolean` | `false` | Shows the "Show values" toggle. |
| `className`, `ref` | | | On the outer `<div>`. |

The props are `HeatmapProps`.
