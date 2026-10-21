import { describe, expect, test } from 'bun:test';
import { accountRoots, usageRoots } from './roots.ts';

describe('the usage roots', () => {
    test('find the sessions of Grok under GROK_HOME, and under the home folder without it', () => {
        const grokOf = (env: Record<string, string | undefined>) => usageRoots(env).find((root) => root.provider === 'grok')?.path;
        expect(grokOf({ HOME: '/home/someone' })).toBe('/home/someone/.grok/sessions');
        expect(grokOf({ HOME: '/home/someone', GROK_HOME: '/data/grok' })).toBe('/data/grok/sessions');
    });

    test('take the sessions of a Grok account from its own folder', () => {
        expect(accountRoots([{ id: 'grok_work', kind: 'grok', folder: '/home/someone/.grok-work' }])).toEqual([
            { provider: 'grok', path: '/home/someone/.grok-work/sessions', accounts: ['grok_work'] }
        ]);
    });
});
