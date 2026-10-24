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

/* A pill is one size of its own, for a control that sits in a round row, so it takes the place of `size`. */
const SHAPE: Record<ButtonShape, string> = {
    default: 'rounded-md text-xs',
    pill: 'h-9 rounded-full px-3.5 text-sm'
};

export function buttonClass(variant: ButtonVariant, size: ButtonSize, shape: ButtonShape): string {
    return clsx(BASE, SHAPE[shape], VARIANT[variant], shape === 'default' && SIZE[size]);
}

/*
 * A split button is one shape: the frame draws the radius, the outline of an outlined variant and the
 * height, and clips both halves, which carry the ground and its hover each on their own.
 */
const SPLIT_FRAME: Record<ButtonVariant, string> = {
    primary: '',
    secondary: 'border border-border',
    ghost: '',
    danger: '',
    'danger-outline': 'border border-status-error/35',
    positive: '',
    inverse: ''
};

const SPLIT_HALF: Record<ButtonVariant, string> = {
    primary: VARIANT.primary,
    secondary: 'bg-surface-raised text-text hover:bg-surface-hover disabled:hover:bg-surface-raised',
    ghost: VARIANT.ghost,
    danger: VARIANT.danger,
    'danger-outline': 'text-status-error hover:bg-status-error/10 disabled:hover:bg-transparent',
    positive: VARIANT.positive,
    inverse: VARIANT.inverse
};

/* The short line between the halves: a light alpha of the text over a filled ground, the border's alpha elsewhere. */
const SPLIT_SEPARATOR: Record<ButtonVariant, string> = {
    primary: 'before:bg-current/30',
    secondary: 'before:bg-border-strong',
    ghost: 'before:bg-border-strong',
    danger: 'before:bg-current/30',
    'danger-outline': 'before:bg-status-error/35',
    positive: 'before:bg-current/30',
    inverse: 'before:bg-current/30'
};

const SPLIT_HEIGHT: Record<ButtonSize, string> = {
    xs: 'h-6',
    sm: 'h-7',
    md: 'h-8'
};

/* Half the height of the button, centered by auto margins, which land on whole pixels in the bordered frames too. */
const SPLIT_SEPARATOR_HEIGHT: Record<ButtonSize, string> = {
    xs: 'before:h-3',
    sm: 'before:h-3.5',
    md: 'before:h-4'
};

const SPLIT_PADDING: Record<'action' | 'menu', Record<ButtonSize, string>> = {
    action: { xs: 'px-2', sm: 'px-2.5', md: 'px-3' },
    // The chevron half is narrower than a half with a word in it.
    menu: { xs: 'px-1', sm: 'px-1.5', md: 'px-2' }
};

export function splitFrameClass(variant: ButtonVariant, size: ButtonSize): string {
    return clsx('inline-flex shrink-0 items-stretch overflow-clip rounded-md', SPLIT_HEIGHT[size], SPLIT_FRAME[variant]);
}

/* The frame clips the focus outline, so a half draws it inside its own edge. */
export function splitHalfClass(variant: ButtonVariant, size: ButtonSize, half: 'action' | 'menu'): string {
    return clsx(
        'inline-flex items-center justify-center gap-1.5 text-xs font-medium focus-visible:-outline-offset-2 disabled:opacity-50',
        SPLIT_HALF[variant],
        SPLIT_PADDING[half][size],
        half === 'menu' &&
            clsx(
                'relative before:absolute before:inset-y-0 before:left-0 before:my-auto before:w-px before:content-[""]',
                SPLIT_SEPARATOR_HEIGHT[size],
                SPLIT_SEPARATOR[variant]
            )
    );
}
