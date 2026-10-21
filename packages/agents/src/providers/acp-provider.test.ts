import { expect, test } from 'bun:test';
import { inProcess } from '../testing/fake-cli.ts';
import { fakeAcp } from '../testing/fake-acp.ts';
import { ACP_CAPABILITIES, createAcpProvider } from './acp-provider.ts';
import { ModelCatalog } from './catalog.ts';

const catalog = new ModelCatalog({
    defaultModel: 'fake-small',
    profiles: { standard: { options: [], contextWindowTokens: {} } },
    models: [{ slug: 'fake-small', name: 'Fake small', profile: 'standard' }]
});

test('a provider spec becomes a chat provider whose backend speaks ACP', async () => {
    const provider = createAcpProvider({
        kind: 'example',
        name: 'Example',
        command: 'example',
        args: ['agent', 'stdio'],
        catalog,
        capabilities: { reportsCost: true }
    });
    expect(provider.command).toEqual(['example', 'agent', 'stdio']);
    expect(provider.capabilities).toEqual({ ...ACP_CAPABILITIES, reportsCost: true });
    expect(provider.resumeCommand).toBe('');
    expect(() => provider.firstPromptArgs('hello')).toThrow('Example is only available as a chat.');
    const fake = inProcess(fakeAcp);
    const backend = provider.createBackend(
        {
            command: provider.command,
            cwd: '/tmp',
            env: {},
            selection: catalog.normalize(undefined),
            modelName: 'Fake small',
            runtimeMode: 'supervised',
            resume: null,
            generation: 1,
            instructions: null,
            resumeNote: null,
            spawn: fake.spawn
        },
        { onEvent: () => undefined }
    );
    await backend.start();
    expect(fake.started[0]?.argv).toEqual(['agent', 'stdio']);
    await backend.dispose();
});
