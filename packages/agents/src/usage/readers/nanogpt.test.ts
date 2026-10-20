import { describe, expect, test } from 'bun:test';
import { nanoGptMightCarryUsage, nanoGptUsageLine, parseNanoGptLine } from './nanogpt.ts';

const entry = {
    at: Date.parse('2026-10-20T09:00:00.000Z'),
    model: 'z-ai/glm-5.3',
    session: 's-1',
    cwd: '/work/repo',
    prompt: 1200,
    cached: 200,
    completion: 300,
    reasoning: 120
};

describe('the NanoGPT usage log', () => {
    test('a line a host wrote is read back as one call, with the cache apart from the input', () => {
        const record = parseNanoGptLine(nanoGptUsageLine(entry).trim());
        expect(record).toMatchObject({
            provider: 'nanogpt',
            model: 'z-ai/glm-5.3',
            sessionId: 's-1',
            cwd: '/work/repo',
            timestampMs: entry.at,
            dedupeKey: null
        });
        // Token kinds are disjoint, so what the cache served is not counted as input too.
        expect(record!.totals).toEqual({ calls: 1, input: 1000, cacheRead: 200, cacheWrite: 0, cacheWrite1h: 0, output: 300, reasoning: 120 });
    });

    test('a cache count above the prompt never makes the input negative', () => {
        const record = parseNanoGptLine(nanoGptUsageLine({ ...entry, prompt: 100, cached: 500 }));
        expect(record!.totals).toMatchObject({ input: 0, cacheRead: 100 });
    });

    test('a call that counted nothing, a line without a model or a moment, and noise are not calls', () => {
        expect(parseNanoGptLine(nanoGptUsageLine({ ...entry, prompt: 0, cached: 0, completion: 0, reasoning: 0 }))).toBeNull();
        expect(parseNanoGptLine(JSON.stringify({ ...entry, model: '' }))).toBeNull();
        expect(parseNanoGptLine(JSON.stringify({ ...entry, at: 'yesterday' }))).toBeNull();
        expect(parseNanoGptLine('not json')).toBeNull();
        expect(parseNanoGptLine('[1,2]')).toBeNull();
    });

    test('only a line that names a model is worth parsing', () => {
        expect(nanoGptMightCarryUsage(nanoGptUsageLine(entry))).toBe(true);
        expect(nanoGptMightCarryUsage('{"hello":"world"}')).toBe(false);
    });
});
