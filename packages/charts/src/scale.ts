import { scaleLinear, scaleLog, scaleTime } from 'd3-scale';
import type { ChartYOptions, ChartYScale } from './types.ts';

export interface StackInput {
    readonly id: string;
    readonly values: readonly (number | null)[];
    /* Series with the same stack key pile up in the order they are listed; without one a series stands on zero. */
    readonly stack: string | null;
}

export interface Stacked {
    readonly base: readonly number[];
    /* Null where the series has no value, which breaks a line. */
    readonly top: readonly (number | null)[];
}

/* Where each series starts and ends per bucket. Negative values pile downward, apart from the positive ones. */
export function stackSeries(series: readonly StackInput[], count: number): Map<string, Stacked> {
    const result = new Map<string, Stacked>();
    const piles = new Map<string, { up: number[]; down: number[] }>();
    for (const { id, values, stack } of series) {
        if (stack === null) {
            result.set(id, { base: Array.from({ length: count }, () => 0), top: Array.from({ length: count }, (_, i) => values[i] ?? null) });
            continue;
        }
        let pile = piles.get(stack);
        if (pile === undefined) {
            pile = { up: Array.from({ length: count }, () => 0), down: Array.from({ length: count }, () => 0) };
            piles.set(stack, pile);
        }
        const base: number[] = [];
        const top: (number | null)[] = [];
        for (let i = 0; i < count; i++) {
            const value = values[i] ?? null;
            const side = value !== null && value < 0 ? pile.down : pile.up;
            base.push(side[i]!);
            if (value === null) {
                top.push(null);
                continue;
            }
            side[i] = side[i]! + value;
            top.push(side[i]!);
        }
        result.set(id, { base, top });
    }
    return result;
}

/* The lowest and highest value any series reaches, stacked tops included, or null without a value. */
export function extentOf(stacked: Iterable<Stacked>, kind: ChartYScale): [number, number] | null {
    let low = Infinity;
    let high = -Infinity;
    for (const { base, top } of stacked) {
        for (let i = 0; i < top.length; i++) {
            const value = top[i];
            if (value === null || value === undefined || (kind === 'log' && value <= 0)) {
                continue;
            }
            low = Math.min(low, value, kind === 'log' ? value : base[i]!);
            high = Math.max(high, value, kind === 'log' ? value : base[i]!);
        }
    }
    return low === Infinity ? null : [low, high];
}

export interface YAxisScale {
    readonly domain: readonly [number, number];
    readonly ticks: readonly number[];
    /* The pixel of a value, unrounded; null for a value a log scale cannot show. */
    at(value: number): number | null;
}

/*
 * The value axis over the extent of the data: a linear axis includes zero, so a column stands on the
 * ground, and rounds its ends out to a tick unless the caller fixed them. A count keeps whole ticks.
 */
export function yScaleOf(kind: ChartYScale, data: [number, number] | null, options: ChartYOptions, range: [number, number], count: number): YAxisScale {
    const include = (options.include ?? []).filter((value) => kind !== 'log' || value > 0);
    const extent: [number, number] | null =
        include.length === 0 ? data : [Math.min(data?.[0] ?? Infinity, ...include), Math.max(data?.[1] ?? -Infinity, ...include)];
    if (kind === 'log') {
        const low = options.min ?? Math.max(extent?.[0] ?? 1, Number.MIN_VALUE);
        const high = options.max ?? Math.max(extent?.[1] ?? 10, low * 10);
        const scale = scaleLog().domain([low, high]).range(range);
        if (options.min === undefined || options.max === undefined) {
            scale.nice();
        }
        const [min, max] = scale.domain() as [number, number];
        const domain: [number, number] = [options.min ?? min, options.max ?? max];
        scale.domain(domain);
        const ticks = scale.ticks(count).filter((tick) => Math.log10(tick) % 1 === 0);
        return { domain, ticks: ticks.length >= 2 ? ticks : scale.ticks(count), at: (value) => (value > 0 ? scale(value) : null) };
    }
    let low = options.min ?? Math.min(0, extent?.[0] ?? 0);
    let high = options.max ?? Math.max(0, extent?.[1] ?? 0);
    if (high <= low) {
        high = low + (options.integer === true ? count : 1);
    }
    if (options.integer === true && options.max === undefined) {
        high = Math.max(high, low + 1);
    }
    const scale = scaleLinear().domain([low, high]).range(range);
    scale.nice(count);
    [low, high] = scale.domain() as [number, number];
    const domain: [number, number] = [options.min ?? low, options.max ?? high];
    scale.domain(domain);
    let ticks = scale.ticks(count);
    if (options.integer === true) {
        ticks = ticks.filter((tick) => Number.isInteger(tick));
    }
    return { domain, ticks, at: (value) => scale(value) };
}

/* As many ticks as fit at one per this many pixels, so a short chart does not crowd its axis. */
export function tickCount(length: number, spacing: number): number {
    return Math.max(2, Math.floor(length / spacing));
}

export interface ContinuousXScale {
    readonly domain: readonly [number, number];
    at(value: number): number;
    invert(pixel: number): number;
    ticks(count: number): number[];
}

/* The smallest distance between two rows, so a row that is missing does not make every bucket twice as long; 0 for one row. */
export function bucketStepOf(xs: readonly number[]): number {
    let step = Infinity;
    for (let i = 1; i < xs.length; i++) {
        const distance = xs[i]! - xs[i - 1]!;
        if (distance > 0) {
            step = Math.min(step, distance);
        }
    }
    return step === Infinity ? 0 : step;
}

/* A time or linear x axis over the buckets, from the first to the end of the last, which is `step` long. */
export function continuousXScale(kind: 'time' | 'linear', xs: readonly number[], range: [number, number], step = 0): ContinuousXScale {
    let low = xs.length === 0 ? 0 : Math.min(...xs);
    let high = xs.length === 0 ? 1 : Math.max(...xs) + step;
    if (high === low) {
        const pad = kind === 'time' ? 30 * 60 * 1000 : 1;
        low -= pad;
        high += pad;
    }
    if (kind === 'time') {
        const scale = scaleTime().domain([low, high]).range(range);
        return {
            domain: [low, high],
            at: (value) => scale(value),
            invert: (pixel) => scale.invert(pixel).getTime(),
            ticks: (count) => scale.ticks(count).map((tick) => tick.getTime())
        };
    }
    const scale = scaleLinear().domain([low, high]).range(range);
    return { domain: [low, high], at: (value) => scale(value), invert: (pixel) => scale.invert(pixel), ticks: (count) => scale.ticks(count) };
}

/* The number of decimals a step between ticks needs, so `0.25` gets two and `5` none. */
export function decimalsOf(step: number): number {
    if (!Number.isFinite(step) || step <= 0) {
        return 0;
    }
    // Through a fixed width first, so the float noise of `0.1 + 0.2` does not count as digits.
    const fraction = String(Number(step.toFixed(6))).split('.')[1];
    return fraction?.length ?? 0;
}
