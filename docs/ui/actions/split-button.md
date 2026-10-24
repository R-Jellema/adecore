# SplitButton

A primary action with a chevron beside it that opens a menu of related actions, drawn as one control: commit, with commit and push behind the chevron.

```tsx
import { Menu, SplitButton } from '@adecore/ui';
```

<Demo src="actions/split-button" />

It reads as one button: one ground, one radius and, on an outlined variant, one border around both halves, with a line half the button's height between them. That line is a light alpha of the text on a filled variant and the border's alpha on the others. The halves are still separate buttons, each with its own hover inside the shared shape. Each takes the focus, can be disabled on its own and carries its own hint. The children are the action half's content, the way a [`Button`](/ui/actions/button)'s are, and `menu` holds the rows of the [`Menu`](/ui/overlays/menu) the chevron opens. The menu hangs under the whole control, lined up with its end unless `menuAlign` says otherwise.

```tsx
<SplitButton
    variant="primary"
    size="sm"
    disabled={!ready}
    tooltip={reason}
    menuLabel="More ways to commit"
    menu={<Menu.Item onClick={commitAndPush}>Commit and push</Menu.Item>}
    onClick={commit}
>
    Commit
</SplitButton>
```

## Props

`SplitButton` takes every prop of a `<button>` for its action half, plus:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `variant` | `ButtonVariant` | `'secondary'` | Both halves. |
| `size` | `ButtonSize` | `'md'` | Both halves; the chevron half is narrower. |
| `tooltip` | `ReactNode` | | The hint on the action half. |
| `menu` | `ReactNode` | | The rows of the menu. Required. |
| `menuLabel` | `string` | | The chevron's accessible name, and its hint unless `menuTooltip` is set. Required. |
| `menuTooltip` | `ReactNode` | | Another hint for the chevron, such as why it is disabled. |
| `menuDisabled` | `boolean` | `false` | |
| `menuAlign` | `'start' \| 'center' \| 'end'` | `'end'` | Where the menu lines up under the control. |
| `menuClassName` | `string` | | A width or layout for the menu, such as `w-72`. |
| `className` | `string` | | On the box around both halves. |
| `ref` | `Ref<HTMLSpanElement>` | | On the box around both halves. |

`SplitButtonProps` is an exported type. There is no pill shape.

## Accessibility

The chevron is a menu trigger: it carries `aria-haspopup` and `aria-expanded`, opens on Enter, Space and the arrow keys, and gives the focus back when the menu closes. Its name comes from `menuLabel`, so the hint and the name never drift apart.
