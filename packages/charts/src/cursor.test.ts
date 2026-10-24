import { describe, expect, test } from 'bun:test';
import { containingIndex, moveIndex, nearestIndex, snapIndex } from './cursor.ts';

const HOUR = 3_600_000;
const hours = [0, 1, 2, 3].map((hour) => hour * HOUR);

describe('snapping', () => {
    test('finds the nearest bucket, the earlier one on a tie', () => {
        expect(nearestIndex(hours, 1.4 * HOUR)).toBe(1);
        expect(nearestIndex(hours, 1.6 * HOUR)).toBe(2);
        expect(nearestIndex(hours, 1.5 * HOUR)).toBe(1);
        expect(nearestIndex(hours, -HOUR)).toBe(0);
        expect(nearestIndex(hours, 9 * HOUR)).toBe(3);
        expect(nearestIndex([], 0)).toBe(-1);
    });

    test('a moment belongs to the bucket it falls in', () => {
        expect(containingIndex(hours, 1.9 * HOUR)).toBe(1);
        expect(containingIndex(hours, 3.5 * HOUR)).toBe(3);
        expect(containingIndex(hours, 5 * HOUR)).toBe(-1);
        expect(containingIndex(hours, -1)).toBe(-1);
    });

    test('a shared x snaps to its own buckets in each chart', () => {
        const other = [0, 2, 4].map((hour) => hour * HOUR);
        expect(snapIndex(hours, false, 2.9 * HOUR)).toBe(3);
        expect(snapIndex(other, false, 2.9 * HOUR)).toBe(1);
        expect(snapIndex(['mon', 'tue'], true, 'tue')).toBe(1);
        expect(snapIndex(hours, false, null)).toBe(-1);
    });
});

describe('the keyboard', () => {
    test('steps through the buckets and stops at the ends', () => {
        expect(moveIndex('ArrowRight', -1, 4)).toBe(0);
        expect(moveIndex('ArrowLeft', -1, 4)).toBe(3);
        expect(moveIndex('ArrowRight', 3, 4)).toBe(3);
        expect(moveIndex('ArrowLeft', 2, 4)).toBe(1);
        expect(moveIndex('Home', 2, 4)).toBe(0);
        expect(moveIndex('End', 0, 4)).toBe(3);
    });

    test('Escape clears a cursor and leaves the key alone without one', () => {
        expect(moveIndex('Escape', 2, 4)).toBeNull();
        expect(moveIndex('Escape', -1, 4)).toBeUndefined();
        expect(moveIndex('a', 2, 4)).toBeUndefined();
    });

    test('Page Up and Page Down go to the first bucket of the previous and the next group', () => {
        const starts = [0, 2, 5];
        expect(moveIndex('PageDown', 3, 8, starts)).toBe(5);
        expect(moveIndex('PageDown', 6, 8, starts)).toBe(5);
        expect(moveIndex('PageUp', 3, 8, starts)).toBe(0);
        expect(moveIndex('PageDown', -1, 8, starts)).toBe(0);
        expect(moveIndex('PageDown', 1, 8)).toBeUndefined();
    });
});
