import { describe, expect, test } from 'bun:test';
import type { ProviderInfo } from '@adecore/agent-contracts';
import { pickOfTarget } from './pane-target';

function providerOf(kind: string, installed: boolean, terminal = true): ProviderInfo {
    return { kind, name: kind, installed, version: null, models: [], capabilities: { terminal } } as unknown as ProviderInfo;
}

const providers = [providerOf('claude', true), providerOf('grok', false), providerOf('apple', false, false)];

describe('pickOfTarget', () => {
    test('the Apple model opens on its detail', () => {
        expect(pickOfTarget('providers.apple', providers)).toEqual({ kind: 'cli', cli: 'apple' });
    });

    test('the add target opens the page to add a provider', () => {
        expect(pickOfTarget('providers.add', providers)).toEqual({ kind: 'catalog' });
    });

    test('a missing CLI opens on its install page', () => {
        expect(pickOfTarget('providers.install.grok', providers)).toEqual({ kind: 'install', cli: 'grok' });
    });

    test('an installed CLI opens on its detail', () => {
        expect(pickOfTarget('providers.install.claude', providers)).toEqual({ kind: 'cli', cli: 'claude' });
    });

    test('a provider that never runs in a terminal opens on its detail', () => {
        expect(pickOfTarget('providers.install.apple', providers)).toEqual({ kind: 'cli', cli: 'apple' });
    });

    test('a CLI the host has not reported yet opens on its install page', () => {
        expect(pickOfTarget('providers.install.grok', [])).toEqual({ kind: 'install', cli: 'grok' });
    });

    test('any other target picks nothing on its own', () => {
        expect(pickOfTarget(null, providers)).toBeNull();
        expect(pickOfTarget('providers.defaults.model', providers)).toBeNull();
        expect(pickOfTarget('providers.install.', providers)).toBeNull();
    });
});
