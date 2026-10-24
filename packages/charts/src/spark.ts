const GAP = 1;

export interface SparkColumn {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/* The columns of a sparkline on whole pixels, 1px apart. A zero keeps a one-pixel floor, so a quiet day still shows. */
export function sparkColumns(values: readonly (number | null)[], width: number, height: number): SparkColumn[] {
    const high = Math.max(0, ...values.map((value) => value ?? 0));
    const step = values.length === 0 ? 0 : (width + GAP) / values.length;
    return values.flatMap((value, index) => {
        if (value === null) {
            return [];
        }
        const x = Math.round(index * step);
        const columnHeight = high === 0 ? 1 : Math.max(1, Math.round((Math.max(0, value) / high) * height));
        return [{ x, y: height - columnHeight, width: Math.max(1, Math.round((index + 1) * step) - x - GAP), height: columnHeight }];
    });
}
