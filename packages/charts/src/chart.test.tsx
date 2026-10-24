import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { act, type ReactNode } from 'react';
import type { Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import i18next from 'i18next';
import { UIProvider } from '@adecore/ui';
import { Chart } from './index.ts';
import { CHARTS_NAMESPACE, CHARTS_RESOURCES } from './locales.ts';

const i18n = i18next.createInstance();
await i18n.init({ lng: 'en', fallbackLng: 'en', resources: { en: { [CHARTS_NAMESPACE]: CHARTS_RESOURCES.en! } }, interpolation: { escapeValue: false } });

interface Score {
    readonly key: string;
    readonly model: string;
    readonly effort: string;
    readonly score: number;
}

const SCORES: Score[] = [
    { key: 'a-low', model: 'Alpha', effort: 'low', score: 40 },
    { key: 'a-high', model: 'Alpha', effort: 'high', score: 52 },
    { key: 'b-low', model: 'Beta', effort: 'low', score: 31 },
    { key: 'b-mid', model: 'Beta', effort: 'mid', score: 38 }
];

const wrap = (node: ReactNode): ReactNode => <UIProvider i18n={i18n}>{node}</UIProvider>;

test('a chart is one named stop for the keyboard and says how to move', () => {
    const markup = renderToStaticMarkup(
        wrap(
            <Chart.Root data={SCORES} x="key" label="Scores">
                <Chart.Bar value="score" label="Score" />
            </Chart.Root>
        )
    );
    expect(markup).toContain('role="group"');
    expect(markup).toContain('aria-roledescription="chart"');
    expect(markup).toContain('aria-label="Scores"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('Arrow keys move between values');
});

test('a chart without data says so', () => {
    const markup = renderToStaticMarkup(
        wrap(
            <Chart.Root data={[] as Score[]} x="key" label="Scores">
                <Chart.Bar value="score" label="Score" />
            </Chart.Root>
        )
    );
    expect(markup).toContain('No data');
});

// Runs with the DOM preload: `bun test --preload ./packages/ui/src/file-tree/testing/preload.ts packages/charts/src/chart.test.tsx`.
describe.skipIf(typeof document === 'undefined')('a mounted chart', () => {
    let container: HTMLDivElement;
    let root: Root;
    let activated: string[];
    let restore: () => void;

    const mount = async (
        node: ReactNode = (
            <Chart.Root data={SCORES} x="key" group="model" label="Scores" selected={['b-low']} onActivate={(row: Score) => activated.push(row.key)}>
                <Chart.XAxis format={(key) => SCORES.find((score) => score.key === key)!.effort} />
                <Chart.Bar value="score" label="Score" />
            </Chart.Root>
        )
    ): Promise<SVGSVGElement> => {
        const { createRoot } = await import('react-dom/client');
        root = createRoot(container);
        await act(async () => {
            root.render(wrap(node));
        });
        return container.querySelector<SVGSVGElement>('svg[role="group"]')!;
    };

    // The DOM of the tests lays nothing out: every box is 600px wide, and a label 7px per character.
    const stubLayout = (): (() => void) => {
        const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
        const measure = SVGTextElement.prototype.getComputedTextLength;
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 600 });
        SVGTextElement.prototype.getComputedTextLength = function (this: SVGTextElement) {
            return (this.textContent?.length ?? 0) * 7;
        };
        return () => {
            if (width === undefined) {
                Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
            } else {
                Object.defineProperty(HTMLElement.prototype, 'clientWidth', width);
            }
            SVGTextElement.prototype.getComputedTextLength = measure;
        };
    };

    const columns = (): SVGRectElement[] => [...container.querySelectorAll<SVGRectElement>('rect[style]')];

    const press = async (target: Element, key: string): Promise<void> => {
        await act(async () => {
            target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        });
    };

    const live = (): string => container.querySelector('[aria-live="polite"]')!.textContent ?? '';
    const active = (plot: SVGSVGElement): string | null =>
        document.getElementById(plot.getAttribute('aria-activedescendant') ?? '')?.getAttribute('aria-label') ?? null;

    beforeEach(() => {
        activated = [];
        restore = stubLayout();
        container = document.createElement('div');
        document.body.append(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        restore();
    });

    test('reads each bucket it moves to, the group first', async () => {
        const plot = await mount(
            <Chart.Root data={SCORES} x="key" group="model" label="Scores">
                <Chart.XAxis format={(key) => SCORES.find((score) => score.key === key)!.effort} />
                <Chart.Bar value="score" label="Score" />
            </Chart.Root>
        );
        await press(plot, 'ArrowRight');
        expect(live()).toBe('Alpha, low, Score 40');
        await press(plot, 'ArrowRight');
        expect(live()).toBe('Alpha, high, Score 52');
    });

    test('a pressable bucket is read once, through its button, with the live region left empty', async () => {
        const plot = await mount();
        await press(plot, 'ArrowRight');
        expect(active(plot)).toBe('Alpha, low, Score 40');
        expect(live()).toBe('');
    });

    test('names a group by its label, apart from its key', async () => {
        const plot = await mount(
            <Chart.Root data={SCORES} x="key" group="model" groupLabel={(row: Score) => `Model ${row.model}`} label="Scores">
                <Chart.XAxis format={(key) => SCORES.find((score) => score.key === key)!.effort} />
                <Chart.Bar value="score" label="Score" />
                <Chart.Tooltip />
            </Chart.Root>
        );
        await press(plot, 'ArrowRight');
        expect(live()).toBe('Model Alpha, low, Score 40');
        expect(container.querySelector('.inset-0 p')!.textContent).toBe('Model Alpha · low');
    });

    test('Page Down goes to the next group and Enter picks the bucket', async () => {
        const plot = await mount();
        await press(plot, 'PageDown');
        await press(plot, 'PageDown');
        expect(active(plot)).toBe('Beta, low, Score 31');
        await press(plot, 'Enter');
        expect(activated).toEqual(['b-low']);
    });

    test('x labels of different widths settle on one set instead of flipping between two', async () => {
        // Twelve buckets of 50px: the short labels fit under every bucket, the long ones under every other.
        const days = Array.from({ length: 12 }, (_, index) => ({ day: index % 2 === 0 ? `d${index}` : `long label ${index}`, value: index }));
        await mount(
            <Chart.Root data={days} x="day" label="Days">
                <Chart.XAxis />
                <Chart.Bar value="value" label="Value" />
            </Chart.Root>
        );
        const labels = [...container.querySelectorAll('text')].filter((text) => text.closest('[visibility="hidden"]') === null);
        expect(labels.map((text) => text.textContent)).toEqual(['d0', 'd2', 'd4', 'd6', 'd8', 'd10']);
    });

    test('columns stand on a time scale, one per bucket of the step, a missing row leaving its slot empty', async () => {
        const hours = [0, 1, 3].map((hour) => ({ at: hour * 3_600_000, count: hour + 1 }));
        await mount(
            <Chart.Root data={hours} x="at" xScale="time" step={3_600_000} label="Per hour">
                <Chart.Bar value="count" label="Count" />
            </Chart.Root>
        );
        // Four hours across 600px: the columns stand in the slots of hour 0, 1 and 3.
        expect(columns().map((column) => Math.floor(Number(column.getAttribute('x')) / 150))).toEqual([0, 1, 3]);
    });

    test('a second x axis writes its row under the first', async () => {
        await mount(
            <Chart.Root data={SCORES} x="key" label="Scores">
                <Chart.XAxis format={(key) => SCORES.find((score) => score.key === key)!.effort} />
                <Chart.XAxis format={(key) => SCORES.find((score) => score.key === key)!.model} thin={false} />
                <Chart.Bar value="score" label="Score" />
            </Chart.Root>
        );
        const rows = [...container.querySelectorAll('text')].filter((text) => text.closest('[visibility="hidden"]') === null);
        const baselines = [...new Set(rows.map((text) => Number(text.getAttribute('y'))))];
        expect(baselines).toHaveLength(2);
        expect(baselines[1]! - baselines[0]!).toBe(16);
        expect(rows.map((text) => text.textContent)).toEqual(['low', 'high', 'low', 'mid', 'Alpha', 'Alpha', 'Beta', 'Beta']);
        await press(container.querySelector('svg[role="group"]')!, 'ArrowRight');
        expect(live()).toBe('Alpha, low, Score 40');
    });

    test('a column stops at the bottom of the plot when the axis starts above zero', async () => {
        await mount(
            <Chart.Root data={SCORES} x="key" y={{ min: 20 }} label="Scores" height={200}>
                <Chart.Bar value="score" label="Score" />
            </Chart.Root>
        );
        const bottoms = columns().map((column) => Number(column.getAttribute('y')) + Number(column.getAttribute('height')));
        expect(Math.max(...bottoms)).toBe(196);
    });

    test('a rule draws above the series at its value, which the axis covers, and the chart names it once', async () => {
        await mount(
            <Chart.Root data={SCORES} x="key" label="Scores">
                <Chart.Rule value={70} label="A" />
                <Chart.YAxis />
                <Chart.Bar value="score" label="Score" />
            </Chart.Root>
        );
        const label = [...container.querySelectorAll('text')].find((text) => text.textContent === 'A · 70')!;
        expect(label).toBeDefined();
        const column = columns()[0]!;
        expect(column.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect([...container.querySelectorAll('text')].some((text) => text.textContent === '80')).toBe(true);
        expect(container.querySelector('[id$="-hint"]')!.textContent).toStartWith('A 70.');
    });

    test('the tooltip keeps a row for a series without a value in the bucket', async () => {
        const hours = [
            { at: 0, errors: null, warnings: 3 },
            { at: 3_600_000, errors: 2, warnings: 4 }
        ];
        const plot = await mount(
            <Chart.Root data={hours} x="at" xScale="time" label="Events">
                <Chart.Line value="errors" label="Errors" />
                <Chart.Line value="warnings" label="Warnings" />
                <Chart.Tooltip />
            </Chart.Root>
        );
        await press(plot, 'ArrowRight');
        const rows = [...container.querySelectorAll('.inset-0 p')].slice(1).map((row) => row.textContent);
        expect(rows).toEqual(['Errors-', 'Warnings3']);
    });

    test('in a group every chart draws the cursor and only the chart that moved it shows its tooltip', async () => {
        const plot = await mount(
            <Chart.Group>
                <Chart.Root data={SCORES} x="key" label="Scores">
                    <Chart.Bar value="score" label="Score" />
                    <Chart.Tooltip />
                </Chart.Root>
                <Chart.Root data={SCORES} x="key" label="Scores again">
                    <Chart.Bar value="score" label="Score" />
                    <Chart.Tooltip />
                </Chart.Root>
            </Chart.Group>
        );
        await press(plot, 'ArrowRight');
        const tooltips = [...container.querySelectorAll('.inset-0')].map((slot) => slot.childElementCount);
        expect(tooltips).toEqual([1, 0]);
        expect(container.querySelectorAll('rect.fill-surface-hover')).toHaveLength(2);
    });

    test('a controlled cursor hears that the pointer left', async () => {
        const changes: unknown[] = [];
        const plot = await mount(
            <Chart.Root data={SCORES} x="key" label="Scores" activeX="a-low" onActiveXChange={(x) => changes.push(x)}>
                <Chart.Bar value="score" label="Score" />
            </Chart.Root>
        );
        await act(async () => {
            plot.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: document.body }));
        });
        expect(changes).toEqual([null]);
    });

    test('a selected bucket is pressed, and Escape clears the cursor', async () => {
        const plot = await mount();
        expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
        await press(plot, 'End');
        expect(plot.getAttribute('aria-activedescendant')).not.toBeNull();
        await press(plot, 'Escape');
        expect(plot.getAttribute('aria-activedescendant')).toBeNull();
    });
});
