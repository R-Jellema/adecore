# CopyButton

A button that puts text on the clipboard and says it did: the copy icon turns into a check and the button reads "Copied" for a second and a half, then goes back. For a DSN, a token, an id, a command to paste into a terminal.

```tsx
import { CopyButton } from '@adecore/ui';
```

<Demo src="actions/copy-button" />

By default it is an [`IconButton`](/ui/actions/icon-button). `label` is its accessible name and its tooltip, `Copy` when left out; while it confirms, the tooltip reads `Copied` and the name stays, so the button does not change what it is called under the keyboard.

```tsx
<CopyButton text={dsn} label="Copy DSN" size="xs" />
```

With `showLabel` it is a [`Button`](/ui/actions/button) with the icon and the word, and the word turns into `Copied`. It takes the `variant` and the `size` of a `Button`.

```tsx
<CopyButton text={output} label="Copy output" showLabel size="sm" variant="secondary" />
```

It copies with [`copyText`](/ui/utilities/clipboard). A browser that refuses gets no confirmation and no error, since there is nothing a person can do about it. A click while it confirms starts the second and a half again. A screen reader hears `Copied` through a status region beside the button.

A copy in a menu is a `Menu.Item` that calls `copyText`: the menu closes on the click, so there is nothing to confirm in.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `text` | `string` | | Required. What goes on the clipboard. |
| `label` | `string` | `'Copy'` | The name and the tooltip of the icon, or the word with `showLabel`. |
| `showLabel` | `boolean` | `false` | A `Button` with the word instead of an `IconButton`. |
| `size` | `IconButtonSize` or `ButtonSize` | `'md'` | The size of the button it is. |
| `variant` | `ButtonVariant` | `'ghost'` | With `showLabel`. |
| `tooltipSide` | `TooltipSide` | `'top'` | Without `showLabel`. |
| `disabled` | `boolean` | | |
| `className` | `string` | | |
| `ref` | `Ref<HTMLButtonElement>` | | |

`CopyButtonProps` is an exported type.
