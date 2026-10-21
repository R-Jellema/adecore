import { expect, test } from 'bun:test';
import type { ModelInfo, ModelSelection } from '@adecore/agent-contracts';
import { stepEffort } from './effort';

const model: ModelInfo = {
    slug: 'opus',
    name: 'Opus',
    legacy: false,
    isDefault: true,
    options: [
        { id: 'fast', label: 'Fast mode', type: 'boolean', defaultValue: false },
        {
            id: 'effort',
            label: 'Reasoning',
            type: 'select',
            defaultChoice: 'high',
            choices: [
                { id: 'low', label: 'Low' },
                { id: 'medium', label: 'Medium' },
                { id: 'high', label: 'High' }
            ]
        }
    ]
};

const at = (effort?: string): ModelSelection => ({ model: 'opus', options: effort === undefined ? { fast: true } : { fast: true, effort } });

test('a step moves one choice along what the model offers and keeps the other options', () => {
    expect(stepEffort(model, at('medium'), 'up')).toEqual({ kind: 'stepped', selection: at('high'), choice: { id: 'high', label: 'High' } });
    expect(stepEffort(model, at('medium'), 'down')).toEqual({ kind: 'stepped', selection: at('low'), choice: { id: 'low', label: 'Low' } });
});

test('a chat that never picked an effort, or picked one the model no longer offers, steps from the default', () => {
    expect(stepEffort(model, at(), 'down')).toMatchObject({ kind: 'stepped', choice: { id: 'medium' } });
    expect(stepEffort(model, at('ultra'), 'down')).toMatchObject({ kind: 'stepped', choice: { id: 'medium' } });
});

test('the ends of what the model offers hold, and say which end it is', () => {
    expect(stepEffort(model, at('high'), 'up')).toEqual({ kind: 'edge', choice: { id: 'high', label: 'High' } });
    expect(stepEffort(model, at('low'), 'down')).toEqual({ kind: 'edge', choice: { id: 'low', label: 'Low' } });
});

test('a model without an effort, or one the catalog does not know, has nothing to step', () => {
    expect(stepEffort({ ...model, options: [] }, at(), 'up')).toEqual({ kind: 'none' });
    expect(stepEffort(undefined, at(), 'up')).toEqual({ kind: 'none' });
});
