import { describe, expect, test } from 'bun:test';
import type { ModelInfo, ProviderInfo } from '@adecore/agent-contracts';
import { pickerEntriesOf, shortlistOf } from './picker-entries';

const model = (slug: string, extra: Partial<ModelInfo> = {}): ModelInfo => ({ slug, name: slug, legacy: false, isDefault: false, options: [], ...extra });
const provider = (models: ModelInfo[]): ProviderInfo => ({ kind: 'claude', name: 'Claude Code', version: '1.0.0', models }) as ProviderInfo;

describe('pickerEntriesOf', () => {
    test('a search for only a model an old CLI cannot run still finds its row', () => {
        const blocked = model('claude-opus-9', { minCliVersion: '9.0' });
        const entries = pickerEntriesOf([provider([blocked])], 'opus', false);
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({ kind: 'model', model: { slug: 'claude-opus-9' } });
    });

    test('legacy models sit behind one expander row', () => {
        const providers = [provider([model('a'), model('b', { legacy: true })])];
        expect(pickerEntriesOf(providers, '', false).map((entry) => entry.kind)).toEqual(['model', 'legacy']);
        expect(pickerEntriesOf(providers, '', true).map((entry) => entry.kind)).toEqual(['model', 'legacy', 'model']);
    });
});

const many = (count: number, vendors: string[] = []): ModelInfo[] =>
    Array.from({ length: count }, (_, i) =>
        model(`m${String(i).padStart(2, '0')}`, { name: `Model ${i}`, ...(vendors.length === 0 ? {} : { vendor: vendors[i % vendors.length]! }) })
    );

describe('a provider with many models', () => {
    const big = provider(many(12, ['Qwen', 'Moonshot AI', 'DeepSeek']).map((entry, i) => (i === 3 ? { ...entry, isDefault: true } : entry)));

    test('keeps the list short, with the picked model and the default (by maker) and one row that opens the rest', () => {
        const entries = pickerEntriesOf([big], '', false, new Set(), { provider: 'claude', model: 'm07' });
        expect(entries.map((entry) => (entry.kind === 'model' ? entry.model.slug : entry.kind))).toEqual(['m07', 'm03', 'all']);
        expect(entries.at(-1)).toMatchObject({ kind: 'all', count: 12, open: false });
    });

    test('lists every model under the row once it is open, grouped by maker and then by name', () => {
        const entries = pickerEntriesOf([big], '', false, new Set(['claude']), null);
        expect(entries[0]).toMatchObject({ kind: 'all', count: 12, open: true });
        const models = entries.flatMap((entry) => (entry.kind === 'model' ? [entry.model] : []));
        expect(models).toHaveLength(12);
        expect(models.map((entry) => entry.vendor)).toEqual([...models.map((entry) => entry.vendor)].sort((a, b) => a!.localeCompare(b!)));
        // Within a maker the names read in order, numbers by value.
        const qwen = models.filter((entry) => entry.vendor === 'Qwen').map((entry) => entry.name);
        expect(qwen).toEqual([...qwen].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })));
    });

    test('a search looks through all of them, by name, slug or maker, and ignores the fold', () => {
        const entries = pickerEntriesOf([big], 'moonshot', false, new Set(), null);
        expect(entries.every((entry) => entry.kind === 'model' && entry.model.vendor === 'Moonshot AI')).toBe(true);
        expect(entries).toHaveLength(4);
        expect(pickerEntriesOf([big], 'model 11', false, new Set(), null).map((entry) => (entry.kind === 'model' ? entry.model.slug : ''))).toEqual(['m11']);
    });

    test('the composer shows the same short list, and none for a list short enough to show whole', () => {
        expect(shortlistOf('claude', big.models, { provider: 'claude', model: 'm07' })?.map((model) => model.slug)).toEqual(['m07', 'm03']);
        expect(shortlistOf('claude', big.models, { provider: 'codex', model: 'm07' })?.map((model) => model.slug)).toEqual(['m03']);
        expect(shortlistOf('claude', big.models.slice(0, 8), null)).toBeNull();
    });

    test('a provider with eight models or fewer is listed whole, as before', () => {
        const small = provider(many(8, ['A', 'B']));
        const entries = pickerEntriesOf([small], '', false);
        expect(entries.every((entry) => entry.kind === 'model')).toBe(true);
        expect(entries).toHaveLength(8);
    });

    test('models with no maker keep the order they came in', () => {
        const plain = provider(many(3));
        expect(pickerEntriesOf([plain], '', false).map((entry) => (entry.kind === 'model' ? entry.model.slug : ''))).toEqual(['m00', 'm01', 'm02']);
    });

    test('each provider folds on its own, and the legacy row still comes last', () => {
        const other = { ...provider(many(10)), kind: 'codex' } as ProviderInfo;
        const legacy = provider([model('old', { legacy: true }), ...many(10)]);
        const entries = pickerEntriesOf([legacy, other], '', false, new Set(['codex']), null);
        expect(entries.at(-1)).toMatchObject({ kind: 'legacy', count: 1 });
        const rows = entries.flatMap((entry) => (entry.kind === 'all' ? [[entry.provider.kind, entry.open]] : []));
        expect(rows).toEqual([
            ['claude', false],
            ['codex', true]
        ]);
    });
});
