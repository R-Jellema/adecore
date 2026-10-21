import { afterEach, describe, expect, test } from 'bun:test';
import { measure, release } from './view.keystroke.fixture.test.ts';

/*
 * The median keystroke takes about 1 ms (code) and 3 ms (flat) on a laptop. A gate twenty times above
 * that only trips on a shared runner for a regression the size of the 92 ms full lex fixed in #57.
 */
const MEDIAN_MS = 60;

afterEach(release);

describe('a keystroke in a document of 100,000 lines', () => {
    for (const name of ['code', 'flat'] as const) {
        for (const wrap of [false, true]) {
            test(`takes under ${MEDIAN_MS} ms at the median in the ${name} document${wrap ? ', wrapped' : ''}`, async () => {
                const { medianMs } = await measure(name, wrap);
                expect(medianMs).toBeLessThan(MEDIAN_MS);
            });
        }
    }
});
