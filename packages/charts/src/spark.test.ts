import { expect, test } from 'bun:test';
import { sparkColumns } from './spark.ts';

test('the columns of a sparkline fill its width on whole pixels, 2px apart', () => {
    const columns = sparkColumns([4, 0, null, 8], 46, 20);
    expect(columns.map((column) => column.x)).toEqual([0, 12, 36]);
    expect(columns.every((column) => column.width === 10)).toBe(true);
    expect(columns.at(-1)!.x + columns.at(-1)!.width).toBe(46);
});

test('a zero is a one-pixel baseline, and the smallest count is never shorter than its column is wide', () => {
    const columns = sparkColumns([100, 0, 1], 22, 16);
    expect(columns.map((column) => [column.height, column.zero])).toEqual([
        [16, false],
        [1, true],
        [6, false]
    ]);
});
