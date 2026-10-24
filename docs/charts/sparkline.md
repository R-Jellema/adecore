# Sparkline

A small chart without axes, for a row of a list or a tile. Its total is in a tooltip, and a screen reader hears the label with the total.

```tsx
import { Sparkline } from '@adecore/charts';
```

<Demo src="charts/sparkline-row" />

```tsx
<Sparkline values={perDay} kind="bars" label="Events of api in 14 days" width={82} height={16} />
<Sparkline values={tokens} label="Tokens in 14 days" tone="running" format={formatTokens} width={160} />
```

`kind="bars"` draws a rounded column per value, 2px apart, as wide as the width allows: 14 values in 82px make columns of 4px. A column is rounded by half its width, at most 2px, and the smallest count stays 2px taller than its two round ends, so it reads as a bar rather than a dot, and a zero is a one-pixel baseline in `--border-strong` so a quiet day still shows; `kind="line"` (the default) draws a line, broken by a missing value. It is one tab stop, so the tooltip opens on the keyboard too.

| Prop               | Type                          | Default        |                                                             |
| ------------------ | ----------------------------- | -------------- | ----------------------------------------------------------- |
| `values`           | `readonly (number \| null)[]` |                | Required.                                                   |
| `label`            | `string`                      |                | Required. What the values are, such as "events in 14 days". |
| `kind`             | `'line' \| 'bars'`            | `'line'`       |                                                             |
| `tone`             | `ChartColor`                  | `'accent'`     |                                                             |
| `format`           | `(value: number) => string`   | `formatNumber` | Writes the total.                                           |
| `width`, `height`  | `number`                      | `96`, `24`     | Pixels.                                                     |
| `className`, `ref` |                               |                | On the `<svg>`.                                             |

The props are `SparklineProps`.
