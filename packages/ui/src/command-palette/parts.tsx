import { createContext, useContext, useRef, type ComponentProps, type ReactNode, type RefObject } from 'react';
import clsx from 'clsx';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { useRender } from '@base-ui/react/use-render';
import { withClass } from '../class-name.ts';
import { DialogPopup, DialogRoot, type DialogPopupProps } from '../dialog/parts.tsx';
import { Icon } from '../Icon.tsx';
import { Kbd } from '../Kbd.tsx';
import { mergeRefs } from '../merge-refs.ts';
import { KEY_SHORTCUTS } from '../shortcut.ts';

/* The field, for the popup to put the focus in when it opens: a control before it would take it otherwise. */
const InputRefContext = createContext<RefObject<HTMLInputElement | null> | null>(null);

/* A palette asks for a few words and shows rows of one line; a search whose rows are lines of source needs the wider one. */
const SIZE = {
    md: 'w-[576px]',
    lg: 'w-[760px]'
} as const;

type AutocompleteProps<ItemValue> = Omit<
    Autocomplete.Root.Props<ItemValue>,
    'open' | 'defaultOpen' | 'onOpenChange' | 'onOpenChangeComplete' | 'inline' | 'openOnInputClick' | 'modal' | 'actionsRef' | 'items'
> & {
    /* A flat list, or groups of `{ value, items }`. Any object with `items` is a group, as Base UI's overloads take it. */
    items?: readonly ItemValue[] | readonly { readonly items: readonly ItemValue[] }[];
};

type DialogProps = Pick<ComponentProps<typeof DialogRoot>, 'open' | 'defaultOpen' | 'onOpenChange' | 'onOpenChangeComplete'>;

export type CommandPaletteRootProps<ItemValue> = AutocompleteProps<ItemValue> & DialogProps;

/*
 * A dialog around a list that is always open. `open` and its handlers are the dialog's; the rest
 * is Base UI's autocomplete, so the query, the items and their filter work as in a combobox. The
 * first row is highlighted and stays so while the pointer leaves the list, which is what Enter runs.
 */
export function CommandPaletteRoot<ItemValue>({
    open,
    defaultOpen,
    onOpenChange,
    onOpenChangeComplete,
    autoHighlight = 'always',
    keepHighlight = true,
    items,
    children,
    ...props
}: CommandPaletteRootProps<ItemValue>) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <DialogRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
            <InputRefContext value={inputRef}>
                {/* Its props take a flat list or groups; only its overloads split the two, which a generic caller cannot pick between. */}
                <Autocomplete.Root<ItemValue>
                    {...props}
                    items={items as readonly ItemValue[] | undefined}
                    inline
                    open
                    autoHighlight={autoHighlight}
                    keepHighlight={keepHighlight}
                >
                    {children}
                </Autocomplete.Root>
            </InputRefContext>
        </DialogRoot>
    );
}

export type CommandPalettePopupProps = Omit<DialogPopupProps, 'size'> & {
    size?: keyof typeof SIZE;
};

/*
 * The dialog's surface. It hangs from a fixed line near the top instead of the middle: the list
 * changes height with every key, and a centered popup would walk up and down the screen.
 */
export function CommandPalettePopup({ size = 'md', initialFocus, className, ...props }: CommandPalettePopupProps) {
    const { t } = useTranslation('ui');
    const inputRef = useContext(InputRefContext);
    return (
        <DialogPopup
            aria-label={t('palette.label')}
            initialFocus={initialFocus ?? inputRef ?? undefined}
            className={withClass(clsx('top-[18vh] flex flex-col [translate:-50%_0]', SIZE[size]), className)}
            {...props}
        />
    );
}

export type CommandPaletteInputProps = Omit<ComponentProps<typeof Autocomplete.Input>, 'className'> & {
    /* In front of the text instead of the magnifier: the mark of a mode, a button back. */
    leading?: ReactNode;
    /* After the text, before the Escape hint: toggles of a search, a button that uses the text. */
    trailing?: ReactNode;
    /* The Escape key at the end of the field. Off where Escape does something else first. */
    escapeHint?: boolean;
    /* A pattern or a path read back letter by letter. */
    mono?: boolean;
    /* Goes to the row around the field; `ref` stays on the input. */
    className?: string;
};

/* The field across the top. It keeps the keys while the arrows move the highlight; a control beside it should not take the focus on a click. */
export function CommandPaletteInput({ leading, trailing, escapeHint = true, mono = false, className, ref, ...props }: CommandPaletteInputProps) {
    const inputRef = useContext(InputRefContext);
    return (
        <div className={clsx('relative flex shrink-0 items-center gap-2 border-b border-border px-3', className)}>
            {leading ?? <Icon icon={Search} size={14} className="shrink-0 text-text-faint" />}
            <Autocomplete.Input
                ref={mergeRefs(ref, inputRef ?? undefined)}
                spellCheck={false}
                className={clsx('h-11 min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint', mono && 'font-mono text-code')}
                {...props}
            />
            {trailing}
            {escapeHint && <Kbd shortcut={KEY_SHORTCUTS.escape} variant="inline" className="shrink-0" />}
        </div>
    );
}

/* The rows. It scrolls on its own, so the field and the footer stay put. */
export function CommandPaletteList({ className, ...props }: ComponentProps<typeof Autocomplete.List>) {
    const { t } = useTranslation('ui');
    return (
        <Autocomplete.List
            aria-label={t('palette.results')}
            className={withClass('max-h-[50vh] min-h-0 overflow-y-auto overscroll-contain scroll-py-1.5 not-empty:p-1.5', className)}
            {...props}
        />
    );
}

export type CommandPaletteFooterProps = useRender.ComponentProps<'div'>;

/* Under the list: the keys that work here, a count, an action that leaves the palette. */
export function CommandPaletteFooter({ render, className, ref, ...props }: CommandPaletteFooterProps) {
    return useRender({
        render,
        ref,
        defaultTagName: 'div',
        props: { ...props, className: clsx('flex shrink-0 items-center gap-3 border-t border-border px-3 py-2 text-xs text-text-faint', className) }
    });
}
