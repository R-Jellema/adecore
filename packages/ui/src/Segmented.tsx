import type { KeyboardEvent, Ref } from 'react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { Icon } from './Icon.tsx';
import { Tooltip } from './Tooltip.tsx';

export interface SegmentedOption<T extends string> {
    id: T;
    label: string;
    icon?: LucideIcon;
    /* Dims the option and takes it out of the tab order and the arrow keys; the rest of the group stays usable. */
    disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
    value: T;
    onValueChange(id: T): void;
    options: readonly SegmentedOption<T>[];
    /* The accessible name of the group. */
    label: string;
    disabled?: boolean;
    /* `vertical` stacks the options in a column as wide as its container, for labels too long to stand side by side. */
    orientation?: 'horizontal' | 'vertical';
    /* 32 pixels high at `md` and 28 at `sm`, the heights of `Input`, `Select` and `Button`. */
    size?: 'md' | 'sm';
    /* Draws every option as a square with its icon, the label as its accessible name and its tooltip. */
    iconOnly?: boolean;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

const STEPS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

const SIZE = {
    md: { track: 'rounded-lg', row: 'min-h-8', option: 'min-h-7 rounded-md px-3 py-1', square: 'size-7 rounded-md', icon: 14 },
    sm: { track: 'rounded-md', row: 'min-h-7', option: 'min-h-6 rounded-sm px-2.5 py-0.5', square: 'size-6 rounded-sm', icon: 12 }
} as const;

/*
 * One of a few options side by side in one sunken track, the picked one lifted out of it. A radio
 * group: one tab stop, and the arrows pick and focus the next option, around the ends.
 */
export function Segmented<T extends string>({
    value,
    onValueChange,
    options,
    label,
    disabled,
    orientation = 'horizontal',
    size = 'md',
    iconOnly = false,
    className,
    ref
}: SegmentedProps<T>) {
    const vertical = orientation === 'vertical';
    const sizing = SIZE[size];
    const picked = options.findIndex((option) => option.id === value);
    const firstEnabled = options.findIndex((option) => !option.disabled);
    const stop = picked !== -1 && !options[picked]!.disabled ? picked : firstEnabled;

    // The first option from `index` on, in the direction of `step` and around the ends, that can be picked.
    const nearest = (index: number, step: number): number => {
        for (let offset = 0; offset < options.length; offset++) {
            const candidate = (((index + step * offset) % options.length) + options.length) % options.length;
            if (!options[candidate]!.disabled) {
                return candidate;
            }
        }
        return -1;
    };

    function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        const next =
            event.key in STEPS
                ? nearest(index + STEPS[event.key]!, STEPS[event.key]!)
                : event.key === 'Home'
                  ? nearest(0, 1)
                  : event.key === 'End'
                    ? nearest(options.length - 1, -1)
                    : null;
        if (next === null || next === -1) {
            return;
        }
        event.preventDefault();
        onValueChange(options[next]!.id);
        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
    }

    return (
        <div
            ref={ref}
            className={clsx(
                'flex bg-surface-sunken p-0.5 text-xs font-medium',
                sizing.track,
                vertical ? 'w-full flex-col items-stretch gap-0.5' : clsx(sizing.row, 'w-fit items-center'),
                className
            )}
            role="radiogroup"
            aria-label={label}
            aria-orientation={vertical ? 'vertical' : undefined}
        >
            {options.map((option, index) => {
                const button = (
                    <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={value === option.id}
                        tabIndex={index === stop ? 0 : -1}
                        disabled={disabled || option.disabled}
                        className={clsx(
                            'flex items-center transition-colors disabled:opacity-50',
                            iconOnly ? clsx(sizing.square, 'justify-center') : clsx(sizing.option, 'gap-1.5 text-left'),
                            value === option.id ? 'bg-surface-raised text-text shadow-raised' : 'text-text-muted enabled:hover:text-text'
                        )}
                        onClick={() => onValueChange(option.id)}
                        onKeyDown={(event) => move(event, index)}
                    >
                        {option.icon && <Icon icon={option.icon} size={sizing.icon} className="shrink-0" />}
                        {!iconOnly && option.label}
                    </button>
                );
                return iconOnly ? (
                    <Tooltip key={option.id} label={option.label} name>
                        {button}
                    </Tooltip>
                ) : (
                    button
                );
            })}
        </div>
    );
}
