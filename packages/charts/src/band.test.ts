import { describe, expect, test } from 'bun:test';
import { bandLayout, columnsIn, GROUP_GAP, LABEL_LIFT, placeValueLabels, segmentOf } from './band.ts';

describe('the buckets of a band scale', () => {
    test('share the room equally', () => {
        const layout = bandLayout(4, null, 400);
        expect(layout.bucket).toBe(100);
        expect(layout.lefts).toEqual([0, 100, 200, 300]);
        expect(layout.width).toBe(400);
    });

    test('leave a gap between groups and half of one at the ends, and a group holds as many buckets as it has rows', () => {
        const layout = bandLayout(5, ['a', 'a', 'b', 'b', 'b'], 100 * 5 + 2 * GROUP_GAP);
        const half = GROUP_GAP / 2;
        expect(layout.bucket).toBe(100);
        expect(layout.lefts).toEqual([half, 100 + half, 200 + 3 * half, 300 + 3 * half, 400 + 3 * half]);
        expect(layout.groups.map(({ key, first, last }) => [key, first, last])).toEqual([
            ['a', 0, 1],
            ['b', 2, 4]
        ]);
    });

    test('take the gap the chart asks for', () => {
        expect(bandLayout(2, ['a', 'b'], 240, 0, 20).lefts).toEqual([10, 130]);
    });

    test('a key that comes back later starts a group of its own', () => {
        expect(bandLayout(3, ['a', 'b', 'a'], 300).groups.map((group) => group.key)).toEqual(['a', 'b', 'a']);
    });

    test('grow wider than the room below the narrowest bucket allowed', () => {
        const layout = bandLayout(40, null, 300, 16);
        expect(layout.bucket).toBe(16);
        expect(layout.width).toBe(640);
    });
});

describe('columns', () => {
    test('stand on whole pixels with air to the next bucket', () => {
        const [column] = columnsIn(10.4, 20, 1);
        expect(Number.isInteger(column!.x) && Number.isInteger(column!.width)).toBe(true);
        expect(column!.x).toBeGreaterThanOrEqual(11);
        expect(column!.x + column!.width).toBeLessThanOrEqual(30);
    });

    test('are never narrower than 2px', () => {
        expect(columnsIn(0, 1.5, 1)[0]!.width).toBe(2);
        expect(columnsIn(0, 4, 3).every((column) => column.width === 2)).toBe(true);
    });

    test('take the width the chart gives them, within the bucket and never under 2px', () => {
        const slotMinusFour = (bucket: number): number => Math.max(6, Math.min(44, Math.floor(bucket) - 4));
        expect(columnsIn(0, 30, 1, slotMinusFour)[0]!.width).toBe(26);
        expect(columnsIn(0, 100, 1, slotMinusFour)[0]!.width).toBe(44);
        expect(columnsIn(0, 4, 1, slotMinusFour)[0]!.width).toBe(4);
        expect(columnsIn(0, 30, 1, () => 0)[0]!.width).toBe(2);
    });

    test('side by side keep 1px between them', () => {
        const [first, second] = columnsIn(0, 40, 2);
        expect(second!.x - (first!.x + first!.width)).toBe(1);
    });

    test('a stacked segment leaves 1px of ground to the one under it, and a small value keeps a pixel', () => {
        expect(segmentOf(40, 100, true, 6)).toEqual({ y: 40, height: 60 });
        expect(segmentOf(40, 100, false, 6)).toEqual({ y: 40, height: 59 });
        expect(segmentOf(99.8, 100, true, 0.01)).toEqual({ y: 99, height: 1 });
        expect(segmentOf(100, 100, true, 0)).toEqual({ y: 100, height: 0 });
    });
});

describe('value labels', () => {
    test('stand just over their column, and over every label in the way', () => {
        const [first, second, third, fourth] = placeValueLabels([
            { center: 10, top: 100, width: 28 },
            { center: 30, top: 102, width: 28 },
            { center: 50, top: 101, width: 28 },
            { center: 200, top: 102, width: 28 }
        ]);
        expect(first).toBe(100 - LABEL_LIFT);
        expect(first! - second!).toBeGreaterThanOrEqual(16);
        expect(first! - second!).toBeLessThan(32);
        // The second label moved up out of its way, so the third fits over its own column.
        expect(third).toBe(101 - LABEL_LIFT);
        expect(fourth).toBe(102 - LABEL_LIFT);
    });
});
