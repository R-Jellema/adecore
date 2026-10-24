import { describe, expect, test } from 'bun:test';
import { decimalsOf, extentOf, stackSeries, yScaleOf } from './scale.ts';

describe('stacking', () => {
    test('piles a series on the ones before it in the same stack and leaves the others on zero', () => {
        const stacked = stackSeries(
            [
                { id: 'input', values: [3, 1], stack: 'tokens' },
                { id: 'output', values: [2, null], stack: 'tokens' },
                { id: 'errors', values: [5, 4], stack: null }
            ],
            2
        );
        expect(stacked.get('output')).toEqual({ base: [3, 1], top: [5, null] });
        expect(stacked.get('errors')).toEqual({ base: [0, 0], top: [5, 4] });
    });

    test('piles negative values downward, apart from the positive ones', () => {
        const stacked = stackSeries(
            [
                { id: 'in', values: [4], stack: 'flow' },
                { id: 'out', values: [-3], stack: 'flow' },
                { id: 'more', values: [-2], stack: 'flow' }
            ],
            1
        );
        expect(stacked.get('more')).toEqual({ base: [-3], top: [-5] });
    });

    test('the domain covers the top of a stack, not only its largest series', () => {
        const stacked = stackSeries(
            [
                { id: 'input', values: [40, 10], stack: 'tokens' },
                { id: 'output', values: [30, 5], stack: 'tokens' }
            ],
            2
        );
        const scale = yScaleOf('linear', extentOf(stacked.values(), 'linear'), {}, [200, 0], 5);
        expect(scale.domain).toEqual([0, 70]);
    });
});

describe('the value axis', () => {
    test('starts at zero and rounds its top out to a tick', () => {
        const scale = yScaleOf('linear', [12, 87], {}, [100, 0], 5);
        expect(scale.domain).toEqual([0, 100]);
        expect(scale.ticks).toEqual([0, 20, 40, 60, 80, 100]);
        expect(scale.at(50)).toBe(50);
    });

    test('keeps the ends the caller fixed', () => {
        const scale = yScaleOf('linear', [12, 87], { min: 10, max: 90 }, [100, 0], 5);
        expect(scale.domain).toEqual([10, 90]);
    });

    test('a count keeps whole ticks, also when the values are small', () => {
        const scale = yScaleOf('linear', [0, 2], { integer: true }, [100, 0], 8);
        expect(scale.ticks.every(Number.isInteger)).toBe(true);
        expect(scale.ticks).toEqual([0, 1, 2]);
    });

    test('a chart without values still has an axis', () => {
        expect(yScaleOf('linear', null, {}, [100, 0], 5).domain).toEqual([0, 1]);
    });

    test('a log scale ticks on the decades and cannot place zero', () => {
        const scale = yScaleOf('log', [3, 4200], {}, [100, 0], 5);
        expect(scale.domain).toEqual([1, 10000]);
        expect(scale.ticks).toEqual([1, 10, 100, 1000, 10000]);
        expect(scale.at(0)).toBeNull();
    });

    test('a tick step decides the decimals of its labels', () => {
        expect(decimalsOf(20)).toBe(0);
        expect(decimalsOf(0.5)).toBe(1);
        expect(decimalsOf(0.25)).toBe(2);
        expect(decimalsOf(0.1 + 0.2)).toBe(1);
    });
});
