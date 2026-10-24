import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import i18next from 'i18next';
import { Combobox, CommandPalette, UIProvider } from '../index.ts';

const i18n = i18next.createInstance();
await i18n.init({ lng: 'en', resources: {}, interpolation: { escapeValue: false } });

const FRUITS = ['Apple', 'Apricot', 'Banana'];

function Suggestions({ onPick }: { onPick(fruit: string): void }) {
    const [text, setText] = useState('');
    return (
        <Combobox.Root items={FRUITS} value={text} onValueChange={setText}>
            <Combobox.Input aria-label="Fruit" />
            <Combobox.Popup>
                <Combobox.List>
                    {(fruit: string) => (
                        <Combobox.Item key={fruit} value={fruit} onClick={() => onPick(fruit)}>
                            {fruit}
                        </Combobox.Item>
                    )}
                </Combobox.List>
            </Combobox.Popup>
        </Combobox.Root>
    );
}

function Palette({ onRun, onOpenChange, onModEnter }: { onRun(fruit: string): void; onOpenChange(open: boolean): void; onModEnter?(fruit: string): void }) {
    const [query, setQuery] = useState('');
    const [highlight, setHighlight] = useState<string | undefined>();
    return (
        <CommandPalette.Root open onOpenChange={onOpenChange} items={FRUITS} value={query} onValueChange={setQuery} onItemHighlighted={setHighlight}>
            <CommandPalette.Popup>
                <CommandPalette.Input
                    aria-label="Jump to"
                    onKeyDown={(event) => {
                        if (onModEnter && event.key === 'Enter' && event.metaKey && highlight !== undefined) {
                            event.preventBaseUIHandler();
                            onModEnter(highlight);
                        }
                    }}
                />
                <CommandPalette.Empty>Nothing matches</CommandPalette.Empty>
                <CommandPalette.List>
                    {(fruit: string) => (
                        <CommandPalette.Item key={fruit} value={fruit} onClick={() => onRun(fruit)}>
                            {fruit}
                        </CommandPalette.Item>
                    )}
                </CommandPalette.List>
            </CommandPalette.Popup>
        </CommandPalette.Root>
    );
}

const key = (target: Element, name: string): void => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
};

const type = (input: HTMLInputElement, text: string): void => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, text);
    // A typed key carries an `inputType`; Base UI reads input without one as autofill and leaves the popup shut.
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
};

const highlighted = (): string[] => [...document.querySelectorAll('[role="option"][data-highlighted]')].map((row) => row.textContent ?? '');

// Runs with the DOM preload: `bun test --preload ./packages/ui/src/file-tree/testing/preload.ts packages/ui/src/combobox`.
describe.skipIf(typeof document === 'undefined')('a combobox and a command palette', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const mount = async (node: ReactNode): Promise<void> => {
        await act(async () => root.render(<UIProvider i18n={i18n}>{node}</UIProvider>));
    };

    test('suggests what matches the text, and Enter takes the highlighted row while the caret stays in the field', async () => {
        const picked: string[] = [];
        await mount(<Suggestions onPick={(fruit) => picked.push(fruit)} />);
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Fruit"]')!;
        await act(async () => {
            input.focus();
            type(input, 'ap');
        });
        expect([...document.querySelectorAll('[role="option"]')].map((row) => row.textContent)).toEqual(['Apple', 'Apricot']);
        await act(async () => key(input, 'ArrowDown'));
        await act(async () => key(input, 'ArrowDown'));
        expect(highlighted()).toEqual(['Apricot']);
        expect(document.activeElement).toBe(input);
        await act(async () => key(input, 'Enter'));
        expect(picked).toEqual(['Apricot']);
    });

    test('opens a palette with the focus in its field and the first row highlighted, which Enter runs', async () => {
        const runs: string[] = [];
        await mount(<Palette onRun={(fruit) => runs.push(fruit)} onOpenChange={() => {}} />);
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Jump to"]')!;
        expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Command palette');
        await act(async () => type(input, 'ban'));
        expect(highlighted()).toEqual(['Banana']);
        await act(async () => key(input, 'Enter'));
        expect(runs).toEqual(['Banana']);
    });

    test('lets the field take a key before Base UI, such as Cmd+Enter on the highlighted row', async () => {
        const runs: string[] = [];
        const elsewhere: string[] = [];
        await mount(<Palette onRun={(fruit) => runs.push(fruit)} onOpenChange={() => {}} onModEnter={(fruit) => elsewhere.push(fruit)} />);
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Jump to"]')!;
        await act(async () => key(input, 'ArrowDown'));
        await act(async () => {
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true, bubbles: true, cancelable: true }));
        });
        expect(elsewhere).toEqual(['Apricot']);
        expect(runs).toEqual([]);
    });

    test('says so when nothing matches, and closes on Escape', async () => {
        const changes: boolean[] = [];
        await mount(<Palette onRun={() => {}} onOpenChange={(open) => changes.push(open)} />);
        const input = document.querySelector<HTMLInputElement>('input[aria-label="Jump to"]')!;
        await act(async () => type(input, 'kiwi'));
        expect(document.querySelectorAll('[role="option"]')).toHaveLength(0);
        expect(document.body.textContent).toContain('Nothing matches');
        await act(async () => key(input, 'Escape'));
        expect(changes).toEqual([false]);
    });
});
