import type { ChartX } from './types.ts';

/* The bucket closest to `x` on a continuous axis, whose buckets are sorted from low to high; -1 without buckets. */
export function nearestIndex(xs: readonly number[], x: number): number {
    if (xs.length === 0 || !Number.isFinite(x)) {
        return -1;
    }
    let low = 0;
    let high = xs.length - 1;
    while (low < high) {
        const middle = (low + high) >> 1;
        if (xs[middle]! < x) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    if (low > 0 && Math.abs(xs[low - 1]! - x) <= Math.abs(xs[low]! - x)) {
        return low - 1;
    }
    return low;
}

/*
 * The bucket a moment falls in, when every bucket starts at its x and runs to the next one: a deploy
 * at 14:37 belongs to the bucket of 14:00. The last bucket is as long as the one before it.
 */
export function containingIndex(xs: readonly number[], at: number): number {
    if (xs.length === 0 || at < xs[0]!) {
        return -1;
    }
    const last = xs.length - 1;
    const step = last > 0 ? xs[last]! - xs[last - 1]! : 0;
    if (at > xs[last]! + step || (step === 0 && at !== xs[last])) {
        return -1;
    }
    let index = nearestIndex(xs, at);
    if (xs[index]! > at) {
        index -= 1;
    }
    return index;
}

/* The bucket the cursor is on: the nearest on a continuous axis, the equal key on a band. */
export function snapIndex(xs: readonly ChartX[], band: boolean, x: ChartX | null): number {
    if (x === null) {
        return -1;
    }
    if (band) {
        return xs.findIndex((key) => String(key) === String(x));
    }
    return typeof x === 'number' ? nearestIndex(xs as number[], x) : -1;
}

/*
 * Where a key moves the cursor: the arrows step a bucket, Home and End go to the ends, Page Up and Page
 * Down to the first bucket of the previous or the next group. `null` clears the cursor, `undefined`
 * leaves the key to the page.
 */
export function moveIndex(key: string, current: number, count: number, groupStarts: readonly number[] = []): number | null | undefined {
    if (count === 0) {
        return undefined;
    }
    switch (key) {
        case 'ArrowRight':
            return current < 0 ? 0 : Math.min(count - 1, current + 1);
        case 'ArrowLeft':
            return current < 0 ? count - 1 : Math.max(0, current - 1);
        case 'Home':
            return 0;
        case 'End':
            return count - 1;
        case 'Escape':
            return current < 0 ? undefined : null;
        case 'PageDown':
        case 'PageUp': {
            if (groupStarts.length === 0) {
                return undefined;
            }
            const at = current < 0 ? -1 : groupStarts.findLastIndex((start) => start <= current);
            const next = key === 'PageDown' ? Math.min(groupStarts.length - 1, at + 1) : Math.max(0, at - 1);
            return groupStarts[next];
        }
        default:
            return undefined;
    }
}
