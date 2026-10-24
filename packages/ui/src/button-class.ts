import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-outline' | 'positive' | 'inverse';
export type ButtonSize = 'xs' | 'sm' | 'md';
export type ButtonShape = 'default' | 'pill';

const BASE = 'inline-flex shrink-0 items-center justify-center gap-1.5 font-medium disabled:opacity-50';

const VARIANT: Record<ButtonVariant, string> = {
    // A filled button darkens under the pointer. Its color is the meaning, so no token of its own for hover.
    primary: 'bg-accent text-accent-text hover:brightness-90 disabled:hover:brightness-100',
    secondary: 'border border-border bg-surface-raised text-text hover:bg-surface-hover disabled:hover:bg-surface-raised',
    ghost: 'text-text-muted hover:bg-surface-hover hover:text-text',
    danger: 'bg-status-error text-accent-text hover:brightness-90 disabled:hover:brightness-100',
    // A step that forgets something rather than destroys it: softer than the filled button of a deletion that cannot come back.
    'danger-outline': 'border border-status-error/35 text-status-error hover:bg-status-error/10 disabled:hover:bg-transparent',
    positive: 'bg-positive text-positive-text hover:brightness-90 disabled:hover:brightness-100',
    // Dark on a light theme, light on a dark one, matching what Apple's and GitHub's sign-in buttons ask for.
    inverse: 'bg-text text-bg hover:opacity-90 disabled:hover:opacity-100'
};

/* 28 and 32 pixels are the compact and the normal control; 24 fits a header of 32. */
const SIZE: Record<ButtonSize, string> = {
    xs: 'h-6 px-2',
    sm: 'h-7 px-2.5',
    md: 'h-8 px-3'
};

/* The chevron half of a split button is narrower than a button with a word in it. */
const NARROW_SIZE: Record<ButtonSize, string> = {
    xs: 'h-6 px-1',
    sm: 'h-7 px-1.5',
    md: 'h-8 px-2'
};

/* A pill is one size of its own, for a control that sits in a round row, so it takes the place of `size`. */
const SHAPE: Record<ButtonShape, string> = {
    default: 'rounded-md text-xs',
    pill: 'h-9 rounded-full px-3.5 text-sm'
};

export function buttonClass(variant: ButtonVariant, size: ButtonSize, shape: ButtonShape): string {
    return clsx(BASE, SHAPE[shape], VARIANT[variant], shape === 'default' && SIZE[size]);
}

/* One half of a split button, square against the other half. A list of its own, so that edge never fights `rounded-md`. */
export function splitHalfClass(variant: ButtonVariant, size: ButtonSize, half: 'action' | 'menu'): string {
    return clsx(BASE, 'text-xs', half === 'action' ? 'rounded-l-md' : 'rounded-r-md', VARIANT[variant], half === 'action' ? SIZE[size] : NARROW_SIZE[size]);
}
