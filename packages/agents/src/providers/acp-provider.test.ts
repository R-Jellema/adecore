import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'bun:test';
import type { BackendEvent, BackendLaunch } from '../chat/backend.ts';
import { inProcess } from '../testing/fake-cli.ts';
import { fakeAcp, fakeAcpWith } from '../testing/fake-acp.ts';
import { UsageScanner } from '../usage/scanner.ts';
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

const TURN_USAGE = { totalTokens: 1500, inputTokens: 1100, outputTokens: 400, cachedReadTokens: 1000 };

/* One turn of a provider on a fake agent that reports `TURN_USAGE`. */
async function oneTurn(provider: ReturnType<typeof createAcpProvider>): Promise<void> {
    const fake = inProcess(fakeAcpWith({ turnUsage: TURN_USAGE }));
    let done: () => void = () => undefined;
    const ended = new Promise<void>((resolve) => {
        done = resolve;
    });
    const backend = provider.createBackend(launchOn(provider, 'fake-small', fake.spawn), {
        onEvent: (event) => {
            if (event.type === 'turn.done') {
                done();
            }
        }
    });
    await backend.start();
    backend.sendTurn({ promptId: 'p-1', text: 'hello', preamble: null, attachments: [], mentions: [], skills: [] });
    await ended;
    await backend.dispose();
}

test('logs the usage a turn reports to the folder the host names, for the scanner to read as a host log', async () => {
    const base = await mkdtemp(join(tmpdir(), 'acp-usage-'));
    try {
        const folder = join(base, 'example-usage');
        const provider = createAcpProvider({ kind: 'example', name: 'Example', command: 'example', catalog: agentDefault(), usageLog: folder });
        await oneTurn(provider);
        // The root's provider is whichever the host logs the agent under; any the usage page knows will do here.
        const scanner = new UsageScanner(join(base, 'home'), [{ provider: 'nanogpt', path: folder }]);
        await scanner.scan();
        expect(scanner.records()).toMatchObject([
            { model: 'fake-small', cwd: '/tmp', totals: { calls: 1, input: 100, cacheRead: 1000, cacheWrite: 0, output: 400, reasoning: 0 } }
        ]);
        expect(scanner.records()[0]!.sessionId).not.toBe('');
    } finally {
        await rm(base, { recursive: true, force: true });
    }
});

test('logs nothing for an agent whose own usage files are read', async () => {
    const base = await mkdtemp(join(tmpdir(), 'acp-usage-'));
    try {
        const folder = join(base, 'grok-usage');
        await oneTurn(createAcpProvider({ kind: 'grok', name: 'Grok', command: 'grok', catalog: agentDefault(), usageLog: folder }));
        expect(await readdir(base)).toEqual([]);
    } finally {
        await rm(base, { recursive: true, force: true });
    }
});
