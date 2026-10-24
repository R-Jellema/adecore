# Banner

The strip over a view: one line and the buttons that answer it. Anything that waits for a person goes here, such as a conflict, a failure or a request. A toast in the corner is read after the fact, and a decision has to be where the eyes already are.

```tsx
import { Banner } from '@adecore/ui';
```

<Demo src="display/banner" />

By default it stands centered along the top of its positioned parent. Show one at a time: the slot is one row, and the caller decides what stands in it. The banner is a polite live region, so a screen reader announces a new line.

## In the flow of a page

With `placement="inline"` the banner is a notice that belongs to the page, such as a warning above a table. It stands in the flow, fills its row and drops the shadow of the floating strip, so it lines up with the panels around it. Its `className` adds margins and the like.

<Demo src="display/banner-inline" />

Without `placement`, a `className` replaces the overlay position instead of adding to it, and the strip keeps its centered shape. Pass `placement="overlay"` to add classes to the floating position.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `icon` | `LucideIcon` | | Required. |
| `tone` | `BannerTone` | | Required. `'attention' \| 'error' \| 'neutral'` colors the icon. |
| `message` | `ReactNode` | | Required. |
| `children` | `ReactNode` | | The buttons. |
| `placement` | `'overlay' \| 'inline'` | `'overlay'` | Floats over the view, or stands in the flow and fills its row. |
| `className` | `string` | | Without `placement`, replaces the overlay position. |
| `ref` | `Ref<HTMLDivElement>` | | |

`BannerProps` and `BannerTone` are exported types.
