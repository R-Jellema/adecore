import { expect, test } from 'bun:test';
import { timeLabelOf } from './time-format.ts';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

test('a time axis writes the clock within a day, the day once ticks are a day apart, and both in between', () => {
    expect(timeLabelOf(12 * HOUR, 2 * HOUR)).toBe('clock');
    expect(timeLabelOf(DAY, 4 * HOUR)).toBe('clock');
    expect(timeLabelOf(3 * DAY, 12 * HOUR)).toBe('dayClock');
    expect(timeLabelOf(14 * DAY, DAY)).toBe('day');
    expect(timeLabelOf(90 * DAY, 7 * DAY)).toBe('day');
});
