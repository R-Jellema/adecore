# Combobox

A text field that suggests as you type, as a compound component on Base UI's autocomplete. The text stays free: a suggestion offers text for the field, it does not hold a value of its own. To pick one of a fixed set of options, use a [`Select`](/ui/inputs/select) with `searchable`.

```tsx
import { Combobox } from '@adecore/ui';
```

<Demo src="inputs/combobox" />

The demo completes the word at the end of the field: first a filter key, then a value of that key. It keeps the list open as long as the field has focus, by holding `open` itself and ignoring the close that a picked row asks for.

## Parts

Every part takes Base UI's own props; the library adds the look, the portal and the placement.

| Part | What it is |
| --- | --- |
| `Combobox.Root` | Base UI's `Autocomplete.Root`, as it is. `value` and `onValueChange` hold the text, `items` the suggestions, `filter` how they match the text (`null` when the caller filters, or the items come from a request). `open`, `onOpenChange`, `autoHighlight` and `onItemHighlighted` work as in Base UI. |
| `Combobox.Input` | The field, drawn as an [`Input`](/ui/inputs/input): `size`, `mono` and an `icon` in front. Inside a [`Field`](/ui/inputs/field) it takes the label and the hint. |
| `Combobox.Popup` | The portal, the positioner and the menu surface in one part. It hangs under the field, 6 pixels away, and is at least as wide as the field. It takes Base UI's placement props (`side`, `align`, `sideOffset`, ...) to say otherwise. |
| `Combobox.List` | The rows. Hand it a function of an item to draw what `items` holds after the filter. Its accessible name is "Suggestions" from the `ui` namespace (`combobox.suggestions`). |
| `Combobox.Item` | One row, drawn as a menu row. Its children are the label. |
| `Combobox.Group`, `Combobox.GroupLabel`, `Combobox.Collection` | A group of rows under a label. Hand `items` a list of `{ value, items }` and draw each group's rows with a `Collection`. |
| `Combobox.Empty` | Shows its children while the list has no rows. Needs `items` on the root. |
| `Combobox.Status` | A line read out as it changes: a search that is still running, how many it found. |

`Empty` and `Status` stay in the document so a screen reader hears them change, and take no room while they have nothing to say.

## A row

`Combobox.Item` lays out a row from a few props beside its label:

| Prop | Type | |
| --- | --- | --- |
| `icon` | `ReactNode` | Before the label, such as a 14px [`Icon`](/ui/display/icon). |
| `hint` | `ReactNode` | Beside the label in a smaller, fainter type, and the first to give way when the row is narrow: the folder a file sits in. |
| `description` | `ReactNode` | A second line under the label. |
| `trailing` | `ReactNode` | At the end of the row: a state, a count, a reference. |
| `shortcut` | `Shortcut` | The shortcut of the row, printed as a [`Kbd`](/ui/display/kbd) at its end. |
| `unstyled` | `boolean` | Leaves the row out, for a row that lays out itself, such as lines of source. It still takes the highlight (`data-highlighted`), Enter and the click. |

`onClick` runs for a click and for Enter on the highlighted row. Base UI clicks the row for Enter, so a modifier held with it does not reach `onClick`. Read Cmd+Enter in the field's `onKeyDown` instead, with the row `onItemHighlighted` last named.

## Suggestions from a request

Pass `filter={null}`, keep the text with `value` and `onValueChange`, and hand `items` what the last answer held. Keep that answer until the next one lands, so the list does not empty and fill again with every key. `Combobox.Status` says the search is still running.

<Demo src="inputs/combobox-async" />

## Keyboard

Base UI handles the keyboard. Typing opens the list, the arrows move the highlight while the caret stays in the field, Enter takes the highlighted row and Escape closes the list. With `autoHighlight` the first row is highlighted as soon as the list opens, so Enter takes it at once.

## Types

`ComboboxInputProps`, `ComboboxPopupProps` and `ComboboxItemProps` are exported types.
