import { expect, test } from 'bun:test';
import type { BackendEvent, BackendLaunch } from '../chat/backend.ts';
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

function launchOn(provider: ReturnType<typeof createAcpProvider>, model: string, spawn: BackendLaunch['spawn']): BackendLaunch {
    const selection = provider.catalog.normalize({ model });
    return {
        command: provider.command,
        cwd: '/tmp',
        env: {},
        selection,
        modelName: provider.catalog.nameOf(selection.model),
        runtimeMode: 'supervised',
        resume: null,
        generation: 1,
        instructions: null,
        resumeNote: null,
        ...(spawn ? { spawn } : {})
    };
}

function agentDefault(): ModelCatalog {
    return new ModelCatalog({
        defaultModel: 'default',
        profiles: { agent: { options: [], contextWindowTokens: {} } },
        models: [{ slug: 'default', name: 'Default', profile: 'agent' }]
    });
}

test('takes the models a session reports, so a later chat can pick one', async () => {
    const provider = createAcpProvider({ kind: 'example', name: 'Example', command: 'example', catalog: agentDefault() });
    const first = inProcess(fakeAcp);
    const backend = provider.createBackend(launchOn(provider, 'default', first.spawn), { onEvent: () => undefined });
    await backend.start();
    await backend.dispose();
    expect(provider.catalog.defaultModel).toBe('fake-small');
    expect(provider.catalog.list().map((model) => [model.slug, model.name])).toEqual([
        ['fake-small', 'Fake small'],
        ['fake-large', 'Fake large']
    ]);

    const sent: string[] = [];
    const second = inProcess((io) => {
        const program = fakeAcp(io);
        return {
            onLine: (line) => {
                sent.push(line);
                program.onLine(line);
            }
        };
    });
    const events: BackendEvent[] = [];
    const chat = provider.createBackend(launchOn(provider, 'fake-large', second.spawn), { onEvent: (event) => events.push(event) });
    await chat.start();
    await chat.dispose();
    expect(sent.some((line) => line.includes('"session/set_config_option"') && line.includes('"fake-large"'))).toBe(true);
    expect(events.find((event) => event.type === 'session')).toMatchObject({ model: 'fake-large' });
});

test('keeps its own catalog where the agent reports no models or the spec says so', async () => {
    const kept = createAcpProvider({ kind: 'example', name: 'Example', command: 'example', catalog: agentDefault(), adoptModels: false });
    const fake = inProcess(fakeAcp);
    const backend = kept.createBackend(launchOn(kept, 'default', fake.spawn), { onEvent: () => undefined });
    await backend.start();
    await backend.dispose();
    expect(kept.catalog.list().map((model) => model.slug)).toEqual(['default']);
    expect(agentDefault().adopt([], 'default')).toBe(false);
});

test('reads its accounts over ACP unless the spec opts out', () => {
    expect(createAcpProvider({ kind: 'example', name: 'Example', command: 'example', catalog: agentDefault() }).askAccount).toBeFunction();
    expect(
        createAcpProvider({ kind: 'example', name: 'Example', command: 'example', catalog: agentDefault(), accountProbe: false }).askAccount
    ).toBeUndefined();
});
