/* The status tones of `@adecore/ui`. */
export type ChartTone = 'accent' | 'error' | 'needsYou' | 'idle' | 'running' | 'muted';

/* A tone, or a color of the app's own as a CSS value such as `var(--lab-mark)`. */
export type ChartColor = ChartTone | { readonly color: string };

/* A key of the row, or a function that reads the value out of it. */
export type ChartAccessor<Row, Value> = (keyof Row & string) | ((row: Row, index: number) => Value);

/* A position on the x axis: a moment in milliseconds, a number or the key of a category. */
export type ChartX = number | string;

/* What `at`, `from` and `to` take: a moment may be a `Date`. */
export type ChartXInput = ChartX | Date;

export type ChartXScale = 'time' | 'linear' | 'band';

export type ChartYScale = 'linear' | 'log';

export interface ChartYOptions {
    readonly min?: number;
    readonly max?: number;
    /* Values the axis covers besides the data, rounded out with it: `[1]` keeps a flat share from filling the plot. */
    readonly include?: readonly number[];
    /* A count: the ticks stay on whole numbers. */
    readonly integer?: boolean;
}

export type ChartCurve = 'linear' | 'monotone' | 'step';

export interface ChartRect {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly width: number;
    readonly height: number;
}
