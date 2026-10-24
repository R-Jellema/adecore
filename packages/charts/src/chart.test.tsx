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
        const plot = await mount();
        await press(plot, 'ArrowRight');
        expect(live()).toBe('Alpha, low, Score 40');
        await press(plot, 'ArrowRight');
        expect(live()).toBe('Alpha, high, Score 52');
    });

    test('Page Down goes to the next group and Enter picks the bucket', async () => {
        const plot = await mount();
        await press(plot, 'PageDown');
        await press(plot, 'PageDown');
        expect(live()).toBe('Beta, low, Score 31');
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

    test('a selected bucket is pressed, and Escape clears the cursor', async () => {
        const plot = await mount();
        expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
        await press(plot, 'End');
        expect(plot.getAttribute('aria-activedescendant')).not.toBeNull();
        await press(plot, 'Escape');
        expect(plot.getAttribute('aria-activedescendant')).toBeNull();
    });
});
