import { describe, expect, test } from 'bun:test';
import { ProviderInstallSchema } from './model.ts';

describe('ProviderInstallSchema', () => {
    test('leaves out a way to sign in this version does not know, and keeps the rest', () => {
        const install = ProviderInstallSchema.parse({
            description: 'An agent',
            commands: { darwin: 'brew install agent' },
            signIn: [{ kind: 'command', command: 'agent login' }, { kind: 'passkey', origin: 'https://example.com' }, { kind: 'chat' }]
        });
        expect(install.signIn).toEqual([{ kind: 'command', command: 'agent login' }, { kind: 'chat' }]);
    });

    test('leaves out a way whose fields do not parse', () => {
        const install = ProviderInstallSchema.parse({ description: 'An agent', commands: {}, signIn: [{ kind: 'env' }] });
        expect(install.signIn).toEqual([]);
    });
});
