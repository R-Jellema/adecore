# RelativeTime

A moment as its age, `5m ago`, with the exact date and time in a tooltip. For the right edge of a row: when a run finished, when a release was last seen, when a token was used.

```tsx
import { RelativeTime } from '@adecore/ui';
```

<Demo src="display/relative-time" />

The age is `formatAge` and the tooltip is `formatDayClockWithYear`, both from [the date formatters](/ui/formatting/dates), so the language and the region a person set write both. Past a week the age turns into the day itself, with the year once it is not this one.

```tsx
<RelativeTime at={run.finishedAt} className="text-xs text-text-faint tabular-nums" />
```

It keeps its age current while it is on screen, on a clock that ticks every thirty seconds, so a page left open does not keep saying `2m ago`. A region change draws it again.

It is a `<time>` with the moment in `dateTime`. Text is no tab stop of its own, so it is one, with the accent outline: the tooltip opens on keyboard focus as it does on hover. A moment that is not known, `null`, `undefined` or an invalid date, is a dash with no tooltip and no tab stop.

Give it the size and the color through `className`. An age inside a sentence ("ended 5m ago") is a string, not this component: write it with `formatAgo` or `formatAge`.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `at` | `Date \| number \| null \| undefined` | | Required. A number is milliseconds since the epoch. |
| `tooltipSide` | `TooltipSide` | `'top'` | |
| `className` | `string` | | |
| `ref` | `Ref<HTMLElement>` | | The `<time>`, or the `<span>` of the dash. |

`RelativeTimeProps` is an exported type.
