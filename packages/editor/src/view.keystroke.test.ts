import { afterEach, describe, expect, test } from 'bun:test';
import { BUDGETS, measure, release, type Budget } from './view.keystroke.fixture.test.ts';

afterEach(release);

describe('a keystroke in a document of 100,000 lines', () => {
    for (const name of ['code', 'flat'] as const) {
        for (const wrap of [false, true]) {
            test(`stays within its budget in the ${name} document${wrap ? ', wrapped' : ''}`, async () => {
                const { mounted, work, medianMs } = await measure(name, wrap);
                const budget = BUDGETS[name];
                const most = (key: keyof (typeof work)[number]): number => Math.max(...work.map((entry) => entry[key]));
                // `ADECORE_KEYSTROKE_REPORT=1` prints what each run measured, to set the budgets again.
                if (process.env.ADECORE_KEYSTROKE_REPORT) {
                    console.log(
                        JSON.stringify({
                            name,
                            wrap,
                            ...Object.fromEntries(Object.keys(budget).map((key) => [key, most(key as keyof Budget)])),
                            medianMs
                        })
                    );
                }
                expect(mounted.editor.getCaret().line).toBe(50_004);
                // A renamed method would leave its spy counting nothing and the gate passing.
                expect(Math.min(most('laidOut'), most('lexedLines'), most('getLine'), most('elementsCreated'))).toBeGreaterThan(0);
                expect(most('getText')).toBe(0);
                expect(most('laidOut')).toBeLessThanOrEqual(budget.laidOut);
                expect(most('lexedLines')).toBeLessThanOrEqual(budget.lexedLines);
                expect(most('getLine')).toBeLessThanOrEqual(budget.getLine);
                expect(most('charactersRead')).toBeLessThanOrEqual(budget.charactersRead);
                expect(most('elementsCreated')).toBeLessThanOrEqual(budget.elementsCreated);
            });
        }
    }
});
