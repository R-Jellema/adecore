import type { AgentKind, ModelInfo, ProviderInfo } from '@adecore/agent-contracts';

/*
 * A provider with more live models than this keeps the list short: the model that is picked and the default,
 * with the rest behind one row that opens all of them. A list of three hundred models is not one to scroll.
 */
export const COMPACT_MODEL_LIMIT = 8;

/* A model row, or a row that folds more models open: one provider's models, or the legacy ones. All of them take a turn in the arrow keys. */
export type PickerEntry =
    | { kind: 'model'; provider: ProviderInfo; model: ModelInfo }
    | { kind: 'legacy'; count: number }
    | { kind: 'all'; provider: ProviderInfo; count: number; open: boolean };

export interface PickerCurrent {
    provider: AgentKind;
    model: string;
}

function matches(model: ModelInfo, query: string): boolean {
    return model.name.toLowerCase().includes(query) || model.slug.toLowerCase().includes(query) || (model.vendor?.toLowerCase().includes(query) ?? false);
}

/*
 * By maker, then by name, when the provider says who made its models; a list with no makers keeps the order
 * it came in. A model with no maker goes last, so the ones that have one read as groups.
 */
export function modelsByVendor(models: ModelInfo[]): ModelInfo[] {
    if (!models.some((model) => model.vendor !== undefined)) {
        return models;
    }
    return [...models].sort((a, b) => {
        if (a.vendor === undefined || b.vendor === undefined) {
            return a.vendor === b.vendor ? 0 : a.vendor === undefined ? 1 : -1;
        }
        return (
            a.vendor.localeCompare(b.vendor, undefined, { sensitivity: 'base' }) ||
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
        );
    });
}

/* The models a long list shows before it is opened: the default and the one that is picked. Null when the list is short enough to show whole. */
export function shortlistOf(kind: AgentKind, models: ModelInfo[], current: PickerCurrent | null): ModelInfo[] | null {
    if (models.length <= COMPACT_MODEL_LIMIT) {
        return null;
    }
    return modelsByVendor(models.filter((model) => model.isDefault || (current?.provider === kind && current.model === model.slug)));
}

const NONE: ReadonlySet<AgentKind> = new Set();

/*
 * The rows of the model list. A model an old CLI cannot run is a row like any other, so a search for
 * only that model still finds the row that explains why it cannot be picked. A search looks through
 * every model of every provider; without one, a provider with many models shows a short list and a row
 * that opens the rest, grouped by maker.
 */
export function pickerEntriesOf(
    providers: readonly ProviderInfo[],
    query: string,
    legacyOpen: boolean,
    expanded: ReadonlySet<AgentKind> = NONE,
    current: PickerCurrent | null = null
): PickerEntry[] {
    const rowsOf = (entry: ProviderInfo, models: ModelInfo[]): PickerEntry[] =>
        modelsByVendor(models).map((model) => ({ kind: 'model', provider: entry, model }));
    if (query !== '') {
        return providers.flatMap((entry) =>
            rowsOf(
                entry,
                entry.models.filter((model) => matches(model, query))
            )
        );
    }
    const legacy = providers.flatMap((entry) =>
        entry.models.filter((model) => model.legacy).map((model) => ({ kind: 'model' as const, provider: entry, model }))
    );
    const live = providers.flatMap((entry): PickerEntry[] => {
        const models = entry.models.filter((model) => !model.legacy);
        const shortlist = shortlistOf(entry.kind, models, current);
        if (shortlist === null) {
            return rowsOf(entry, models);
        }
        if (expanded.has(entry.kind)) {
            return [{ kind: 'all', provider: entry, count: models.length, open: true }, ...rowsOf(entry, models)];
        }
        return [...rowsOf(entry, shortlist), { kind: 'all', provider: entry, count: models.length, open: false }];
    });
    if (legacy.length === 0) {
        return live;
    }
    return legacyOpen ? [...live, { kind: 'legacy', count: legacy.length }, ...legacy] : [...live, { kind: 'legacy', count: legacy.length }];
}
