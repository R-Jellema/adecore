# @adecore/charts

Series charts and sparklines in the theme of [`@adecore/ui`](https://adecore.dev/ui/): lines, areas and columns over time or per category, markers and bands, a tooltip, a legend and a table of values. A chart follows the width of its container, draws on whole pixels, and is one stop for the keyboard that a screen reader reads bucket by bucket. `d3-scale` and `d3-shape` do the math.

**[Documentation](https://adecore.dev/charts/)**

## Install

```sh
bun add @adecore/charts
```

`@adecore/ui`, React 19, `react-dom`, `i18next` and `react-i18next` are peer dependencies. Let Tailwind scan the package next to `@adecore/ui`, and add the `charts` namespace to the app's i18next:

```css
@import "tailwindcss";
@import "@adecore/ui/theme.css";
@source "../node_modules/@adecore/ui/dist";
@source "../node_modules/@adecore/charts/dist";
```

```ts
import { CHARTS_NAMESPACE, CHARTS_RESOURCES } from '@adecore/charts';

for (const [language, words] of Object.entries(CHARTS_RESOURCES)) {
    i18n.addResourceBundle(language, CHARTS_NAMESPACE, words);
}
```

## Use

```tsx
import { Chart } from '@adecore/charts';

<Chart.Root data={buckets} x="at" xScale="time" label="Events per hour" height={220}>
    <Chart.Grid />
    <Chart.XAxis />
    <Chart.YAxis />
    <Chart.Area value="errors" label="Errors" tone="error" />
    <Chart.Line value="warnings" label="Warnings" tone="needsYou" />
    <Chart.Tooltip />
    <Chart.Legend />
</Chart.Root>
```

## License

FSL-1.1-MIT, see [LICENSE](./LICENSE).
