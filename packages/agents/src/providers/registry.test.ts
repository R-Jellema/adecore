import { describe, expect, test } from 'bun:test';
import { claudeProvider } from './claude-provider.ts';
import { ProviderRegistry } from './registry.ts';

describe('ProviderRegistry.list', () => {
    test('passes on how a provider installs', async () => {
        const registry = new ProviderRegistry({ detect: async () => ({ installed: false, version: null }), providers: [claudeProvider], env: {} });
        const [claude] = await registry.list();
        expect(claude?.install?.commands.darwin).toContain('install.sh');
        expect(claude?.install?.signIn[0]).toEqual({ kind: 'command', command: 'claude auth login' });
    });

    test('leaves the field out for a provider without one', async () => {
        const { install: _install, ...bare } = claudeProvider;
        const registry = new ProviderRegistry({ detect: async () => ({ installed: true, version: '1' }), providers: [bare], env: {} });
        const [claude] = await registry.list();
        expect(claude).not.toHaveProperty('install');
    });
});
