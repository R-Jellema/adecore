import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { fakeFormatSource } from '../testing/fake-source.ts';
import { labelCollator, setFormatSource, type FormatSource } from './locale.ts';

const source = fakeFormatSource();
let previous: FormatSource;

beforeAll(() => {
    previous = setFormatSource(source);
});

afterAll(() => {
    setFormatSource(previous);
});

const inLanguage = (language: string): void => {
    source.set({ language });
};

afterEach(() => {
    inLanguage('en');
});

describe('the order labels are read in', () => {
    test('follows the language, which is what wrote the words', () => {
        source.set({ region: 'nl-NL' });
        inLanguage('en');
        expect(labelCollator().resolvedOptions().locale).toBe('en');
        expect(['z', 'ä'].sort(labelCollator().compare)).toEqual(['ä', 'z']);
        inLanguage('nl');
        expect(labelCollator().resolvedOptions().locale).toBe('nl');
        inLanguage('sv');
        expect(['z', 'ä'].sort(labelCollator().compare)).toEqual(['z', 'ä']);
    });

    test('ignores case, so a lowercase label never sinks to the bottom', () => {
        inLanguage('en');
        expect(labelCollator().compare('canvas', 'Canvas')).toBe(0);
        expect(labelCollator().compare('Canvas', 'terminal')).toBeLessThan(0);
    });
});
