const GAP = 2;
/* The straight stretch the shortest column keeps between its two round ends; without it the column is a circle. */
const STRAIGHT = 2;

export interface SparkColumn {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    /* A zero, drawn as a one-pixel baseline without rounding. */
    readonly zero: boolean;
}

/*
 * The columns of a sparkline on whole pixels, 2px apart, rounded at the ends. A column is a little taller than it is
 * wide at least, so the smallest count still reads as a bar rather than a dot; a zero keeps a one-pixel baseline, so a
 * quiet day still shows.
 */
export function sparkColumns(values: readonly (number | null)[], width: number, height: number): SparkColumn[] {
    const high = Math.max(0, ...values.map((value) => value ?? 0));
    const step = values.length === 0 ? 0 : (width + GAP) / values.length;
    return values.flatMap((value, index) => {
        if (value === null) {
            return [];
        }
        const x = Math.round(index * step);
        const columnWidth = Math.max(1, Math.round((index + 1) * step) - x - GAP);
        const zero = value <= 0 || high === 0;
        const columnHeight = zero ? 1 : Math.min(height, Math.max(columnWidth + STRAIGHT, Math.round((value / high) * height)));
        return [{ x, y: height - columnHeight, width: columnWidth, height: columnHeight, zero }];
    });
}
