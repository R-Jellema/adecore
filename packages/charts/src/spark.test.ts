import { expect, test } from 'bun:test';
import { sparkColumns } from './spark.ts';

test('the columns of a sparkline fill its width on whole pixels, 1px apart, with a floor for zero', () => {
    const columns = sparkColumns([4, 0, null, 8], 47, 20);
    expect(columns.map((column) => column.x)).toEqual([0, 12, 36]);
    expect(columns.every((column) => column.width === 11)).toBe(true);
    expect(columns.map((column) => column.height)).toEqual([10, 1, 20]);
    expect(columns.at(-1)!.x + columns.at(-1)!.width).toBe(47);
});
