import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { act, type ReactNode } from 'react';
import type { Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import i18next from 'i18next';
import { UIProvider } from '@adecore/ui';
import { Chart, SeriesLegend, type ChartX } from './index.ts';
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

    test('a group label takes its columns and half the gap on each side, so the labels tile the plot', async () => {
        await mount(
            <Chart.Root data={SCORES} x="key" group="model" groupGap={20} label="Scores">
                <Chart.Bar value="score" label="Score" />
                <Chart.GroupAxis>{(group) => group.label}</Chart.GroupAxis>
            </Chart.Root>
        );
        const boxes = [...container.querySelectorAll<HTMLDivElement>('.col-start-1')].map((box) => [box.style.marginLeft, box.style.width]);
        expect(boxes).toEqual([
            ['0px', '300px'],
            ['300px', '300px']
        ]);
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

    test('Enter on a time scale presses nothing, as its buckets are no buttons', async () => {
        const hours = [0, 1, 3].map((hour) => ({ at: hour * 3_600_000, count: hour + 1 }));
        const plot = await mount(
            <Chart.Root data={hours} x="at" xScale="time" step={3_600_000} label="Per hour" onActivate={(row) => activated.push(String(row.at))}>
                <Chart.Bar value="count" label="Count" />
            </Chart.Root>
        );
        await press(plot, 'End');
        await press(plot, 'Enter');
        await press(plot, ' ');
        expect(activated).toEqual([]);
    });

    test('a value above `y.max` stops at the top of the plot', async () => {
        await mount(
            <Chart.Root data={SCORES} x="key" y={{ max: 40 }} label="Scores">
                <Chart.Bar value="score" label="Score" />
                <Chart.Line value="score" label="Score" />
            </Chart.Root>
        );
        expect(Math.min(...columns().map((column) => Number(column.getAttribute('y'))))).toBe(8);
        const line = container.querySelector('path[fill="none"]')!.getAttribute('d')!;
        expect(Math.min(...[...line.matchAll(/,(-?[\d.]+)/g)].map((match) => Number(match[1])))).toBe(8);
    });

    test('the pointer on a time scale hands on the x of a bucket, once per bucket it enters', async () => {
        const hours = [0, 1, 3].map((hour) => ({ at: hour * 3_600_000, count: hour + 1 }));
        const changes: (ChartX | null)[] = [];
        const plot = await mount(
            <Chart.Root data={hours} x="at" xScale="time" step={3_600_000} label="Per hour" onActiveXChange={(x) => changes.push(x)}>
                <Chart.Bar value="count" label="Count" />
            </Chart.Root>
        );
        for (const clientX of [10, 40, 140, 160, 200, 320, 340, 500]) {
            await act(async () => {
                plot.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX, clientY: 50 }));
            });
        }
        // Hour 2 has no row, so the pointer over its slot is on no bucket.
        expect(changes).toEqual([0, 3_600_000, null, 10_800_000]);
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

    test('value labels write each column over it, through the function when given, with room above the plot', async () => {
        await mount(
            <Chart.Root data={SCORES} x="key" y={{ max: 52 }} label="Scores">
                <Chart.Bar value="score" label="Score" valueLabels={(value) => `${value} pts`} />
            </Chart.Root>
        );
        const labels = [...container.querySelectorAll('text')].map((text) => text.textContent);
        expect(labels).toEqual(['40 pts', '52 pts', '31 pts', '38 pts']);
        // The tallest column reaches the top of the plot, and its label still stands inside the svg.
        const tallest = Math.min(...columns().map((column) => Number(column.getAttribute('y'))));
        expect(tallest).toBe(24);
    });

    test('a scrolling plot keeps room over the y axis for what hangs out of its first bucket', async () => {
        const plot = await mount(
            <Chart.Root data={SCORES} x="key" minBucketWidth={400} label="Scores">
                <Chart.YAxis />
                <Chart.Bar value="score" label="Score" valueLabels />
            </Chart.Root>
        );
        const scroller = plot.parentElement!;
        const axis = Number(scroller.previousElementSibling!.getAttribute('width'));
        expect(axis).toBeGreaterThan(0);
        expect(scroller.style.marginLeft).toBe(`-${axis}px`);
        expect(scroller.style.paddingLeft).toBe(`${axis}px`);
    });

    test('value labels stack by the width they measure, not by an estimate per character', async () => {
        // Eighteen buckets of 33px; labels of four characters measure 28px here and are estimated at 32px, which would collide.
        const columns = Array.from({ length: 18 }, (_, index) => ({ key: `c${index}`, value: 10 }));
        await mount(
            <Chart.Root data={columns} x="key" label="Columns">
                <Chart.Bar value="value" label="Value" valueLabels={() => 'abcd'} />
            </Chart.Root>
        );
        const baselines = new Set([...container.querySelectorAll('text')].map((text) => text.getAttribute('y')));
        expect(baselines.size).toBe(1);
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

    const MEASURED = [
        { key: 'a-low', model: 'Alpha', effort: 'low', cost: 0.02, score: 40 },
        { key: 'a-high', model: 'Alpha', effort: 'high', cost: 0.3, score: 52 },
        { key: 'b-low', model: 'Beta', effort: 'low', cost: 0.05, score: 39 },
        { key: 'b-mid', model: 'Beta', effort: 'mid', cost: 2, score: 58 }
    ];
    type Measured = (typeof MEASURED)[number];

    const scatter = (props: { onActiveXChange?: (x: unknown) => void } = {}): ReactNode => (
        <Chart.Root
            data={MEASURED}
            rows="points"
            x="cost"
            xScale="log"
            rowKey="key"
            rowLabel="effort"
            group="model"
            y={{ step: 10 }}
            label="Intelligence against cost"
            height={300}
            selected={['b-mid']}
            onActivate={(row: Measured) => activated.push(row.key)}
            onActiveXChange={props.onActiveXChange}
        >
            <Chart.YAxis title="Intelligence" />
            <Chart.XAxis title="Cost per task" format={(value) => `$${value}`} />
            <Chart.Frontier />
            <Chart.Line value="score" label="Intelligence" />
            <Chart.Point value="score" label="Intelligence" />
            <Chart.EndLabels width={100}>{(series) => <span data-end={series.key}>{series.label}</span>}</Chart.EndLabels>
        </Chart.Root>
    );

    test('a point chart takes the point under the pointer within reach and draws guides to both axes', async () => {
        const changes: unknown[] = [];
        const plot = await mount(scatter({ onActiveXChange: (x) => changes.push(x) }));
        const target = container.querySelector<SVGCircleElement>('circle[role="button"][aria-label^="Alpha, high"]')!;
        const x = Number(target.getAttribute('cx'));
        const y = Number(target.getAttribute('cy'));
        await act(async () => {
            plot.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x + 6, clientY: y - 6 }));
        });
        expect(changes).toEqual(['a-high']);
        const texts = [...container.querySelectorAll('text')].map((text) => text.textContent);
        // The guides write the x and the value of the point on the axes, beside the picked point's.
        expect(texts.filter((text) => text === '$0.3')).toHaveLength(1);
        expect(texts).toContain('Cost per task · logarithmic');
        expect(texts).toContain('Intelligence');
        // Points need no ground: the value axis runs from the step under the lowest point.
        expect(texts).toContain('30');
        expect(texts).not.toContain('0');
        expect(container.querySelectorAll('path[stroke-dasharray="4 4"]')).toHaveLength(2);
        await act(async () => {
            plot.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x + 40, clientY: y + 40 }));
        });
        expect(changes).toEqual(['a-high', null]);
    });

    test('the keyboard moves along a series and to the next one, reads each point and picks it', async () => {
        const plot = await mount(scatter());
        expect(container.querySelector('[id$="-hint"]')!.textContent).toContain('Up and Down to the next series');
        await press(plot, 'ArrowRight');
        await press(plot, 'ArrowRight');
        expect(active(plot)).toBe('Alpha, high, Cost per task $0.3, Intelligence 52');
        await press(plot, 'ArrowDown');
        expect(active(plot)).toBe('Beta, mid, Cost per task $2, Intelligence 58');
        await press(plot, 'Enter');
        expect(activated).toEqual(['b-mid']);
        expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
    });

    test('end labels stand right of the plot at the last point of each series, and the frontier runs through the best points', async () => {
        await mount(scatter());
        const labels = [...container.querySelectorAll<HTMLElement>('[data-end]')].map((label) => label.dataset.end);
        expect(labels).toEqual(['Alpha', 'Beta']);
        const frontier = container.querySelector('polyline')!.getAttribute('points')!.split(' ');
        // Beta low costs more than Alpha low and scores less, so it is left off.
        expect(frontier).toHaveLength(3);
    });

    test('a y axis title stands over the axis of a column chart, with room above the plot', async () => {
        await mount(
            <Chart.Root data={SCORES} x="key" label="Scores">
                <Chart.YAxis title="Index points, higher is better" />
                <Chart.Bar value="score" label="Score" />
            </Chart.Root>
        );
        const title = [...container.querySelectorAll('text')].find((text) => text.textContent === 'Index points, higher is better')!;
        expect(title.getAttribute('y')).toBe('15');
        const tops = columns().map((column) => Number(column.getAttribute('y')));
        expect(Math.min(...tops)).toBeGreaterThanOrEqual(28);
    });

    test('a y axis on each side keeps its own format, title and ticks', async () => {
        const plot = await mount(
            <Chart.Root data={SCORES} x="key" label="Scores">
                <Chart.YAxis format={(value) => `${value} pt`} />
                <Chart.YAxis side="right" title="Index points" ticks={10} />
                <Chart.Bar value="score" label="Score" />
            </Chart.Root>
        );
        const texts = [...container.querySelectorAll('text')].map((text) => text.textContent ?? '');
        expect(texts).toContain('Index points');
        const right = texts.filter((text) => /^\d+$/.test(text));
        expect(right).toEqual(['0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
        expect(texts.filter((text) => text.endsWith(' pt'))).toEqual(right.map((text) => `${text} pt`));
        expect(Math.min(...columns().map((column) => Number(column.getAttribute('y'))))).toBeGreaterThanOrEqual(28);
        await press(plot, 'ArrowRight');
        expect(live()).toBe('a-low, Score 40 pt');
    });

    test('the series legend toggles a series, highlights the one under the pointer and finds by name', async () => {
        const hidden: string[][] = [];
        const highlighted: (string | null)[] = [];
        await mount(
            <SeriesLegend
                label="Models"
                items={[
                    { key: 'a', label: 'Alpha', group: 'north' },
                    { key: 'b', label: 'Beta', group: 'north' },
                    { key: 'c', label: 'Gamma', group: 'south', status: 'No data', disabled: true }
                ]}
                groups={[
                    { key: 'north', label: 'North' },
                    { key: 'south', label: 'South' }
                ]}
                hidden={['b']}
                onHiddenChange={(next) => hidden.push(next)}
                onHighlightedChange={(key) => highlighted.push(key)}
            />
        );
        const button = (name: string): HTMLButtonElement => container.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
        expect(button('Alpha').getAttribute('aria-pressed')).toBe('true');
        expect(button('Beta').getAttribute('aria-pressed')).toBe('false');
        expect(button('Gamma').disabled).toBe(true);
        await act(async () => {
            button('Beta').click();
            button('Alpha').dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
        });
        expect(hidden).toEqual([[]]);
        expect(highlighted).toEqual(['a']);
        const search = container.querySelector('input')!;
        await act(async () => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
            setter.call(search, 'gam');
            search.dispatchEvent(new Event('input', { bubbles: true }));
        });
        expect([...container.querySelectorAll('button[aria-pressed]')].map((entry) => entry.getAttribute('aria-label'))).toEqual(['Gamma']);
    });

    test('a selected bucket is pressed, and Escape clears the cursor', async () => {
        const plot = await mount();
        expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
        await press(plot, 'End');
        expect(plot.getAttribute('aria-activedescendant')).not.toBeNull();
        await press(plot, 'Escape');
        expect(plot.getAttribute('aria-activedescendant')).toBeNull();
    });

    test('an Escape that clears the cursor stops at the chart, so a dialog around it stays open', async () => {
        const reached: string[] = [];
        const listen = (e: globalThis.KeyboardEvent): void => {
            reached.push(e.key);
        };
        document.addEventListener('keydown', listen);
        try {
            const plot = await mount();
            await press(plot, 'End');
            await press(plot, 'Escape');
            expect(reached).toEqual(['End']);
            await press(plot, 'Escape');
            expect(reached).toEqual(['End', 'Escape']);
        } finally {
            document.removeEventListener('keydown', listen);
        }
    });
});
