import { describe, expect, test } from 'bun:test';
import { heatShare, heatStep, moveCell } from './heat.ts';

describe('the steps of a heatmap', () => {
    test('keep the smallest count apart from an empty cell, and the highest in the last step', () => {
        expect(heatStep(1, 100, 5)).toBe(1);
        expect(heatStep(100, 100, 5)).toBe(5);
        expect(heatStep(41, 100, 5)).toBe(3);
        expect(heatStep(0, 100, 5)).toBe(0);
        expect(heatStep(null, 100, 5)).toBe(0);
        expect(heatStep(-3, 100, 5)).toBe(0);
    });

    test('hold a value over a fixed max in the last step', () => {
        expect(heatStep(250, 100, 5)).toBe(5);
        expect(heatStep(4, 0, 5)).toBe(0);
    });

    test('mix the color in from 15% up to 100%, and not at all for an empty cell', () => {
        expect([0, 1, 2, 3, 4, 5].map((step) => heatShare(step, 5))).toEqual([0, 15, 36, 58, 79, 100]);
        expect(heatShare(1, 1)).toBe(100);
    });
});

describe('the keyboard in a heatmap', () => {
    test('starts in the first cell and steps a cell per arrow, stopping at the edges', () => {
        expect(moveCell('ArrowDown', null, 7, 24)).toEqual({ row: 0, column: 0 });
        expect(moveCell('ArrowRight', { row: 2, column: 5 }, 7, 24)).toEqual({ row: 2, column: 6 });
        expect(moveCell('ArrowDown', { row: 6, column: 5 }, 7, 24)).toEqual({ row: 6, column: 5 });
        expect(moveCell('ArrowLeft', { row: 2, column: 0 }, 7, 24)).toEqual({ row: 2, column: 0 });
        expect(moveCell('ArrowUp', { row: 2, column: 5 }, 7, 24)).toEqual({ row: 1, column: 5 });
    });

    test('goes to the ends of the row with Home and End, and to the corners with Control', () => {
        expect(moveCell('End', { row: 2, column: 5 }, 7, 24)).toEqual({ row: 2, column: 23 });
        expect(moveCell('Home', { row: 2, column: 5 }, 7, 24)).toEqual({ row: 2, column: 0 });
        expect(moveCell('End', { row: 2, column: 5 }, 7, 24, true)).toEqual({ row: 6, column: 23 });
        expect(moveCell('Home', { row: 2, column: 5 }, 7, 24, true)).toEqual({ row: 0, column: 0 });
    });

    test('clears with Escape, and leaves other keys and an empty grid to the page', () => {
        expect(moveCell('Escape', { row: 2, column: 5 }, 7, 24)).toBeNull();
        expect(moveCell('Escape', null, 7, 24)).toBeUndefined();
        expect(moveCell('Tab', { row: 2, column: 5 }, 7, 24)).toBeUndefined();
        expect(moveCell('ArrowDown', null, 0, 24)).toBeUndefined();
    });
});
