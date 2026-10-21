import { describe, expect, test } from 'bun:test';
import type { RuntimeMode } from '@adecore/agent-contracts';
import { fakeAcpCapture, type AcpCapture } from '../testing/fake-acp-capture.ts';
import { inProcess } from '../testing/fake-cli.ts';
import { createAcpBackend } from './acp-backend.ts';
import { quotaResetOf } from './acp-protocol.ts';
import type { BackendEvent } from './backend.ts';
import antigravityQuota from './fixtures/antigravity-1.4.1-quota.json';
import grokLimits from './fixtures/grok-1.0.62-limits.json';

const NOW = Date.UTC(2026, 9, 21, 12, 0, 0);
const HOUR = 3_600_000;

/* Runs one turn of a capture on the ACP backend and answers with every event up to its end. */
async function turnOf(capture: AcpCapture, runtimeMode: RuntimeMode = 'supervised'): Promise<BackendEvent[]> {
    const events: BackendEvent[] = [];
    let settle: () => void = () => {};
    const done = new Promise<void>((resolve) => {
        settle = resolve;
    });
    const fake = inProcess(fakeAcpCapture(capture));
    const backend = createAcpBackend({ name: 'Agent' })(
        {
            command: ['agent'],
            cwd: '/tmp',
            env: {},
            selection: { model: 'default', options: {} },
            modelName: 'Default',
            runtimeMode,
            resume: null,
            generation: 1,
            now: () => NOW,
            instructions: null,
            resumeNote: null,
            spawn: fake.spawn
        },
        {
            onEvent: (event) => {
                events.push(event);
                if (event.type === 'turn.done') {
                    settle();
                }
            }
        }
    );
    await backend.start();
    backend.sendTurn({ promptId: 'prompt-1', text: 'Go on.', preamble: null, attachments: [], mentions: [], skills: [] });
    await done;
    await backend.dispose();
    return events;
}

function turnDone(events: BackendEvent[]): Extract<BackendEvent, { type: 'turn.done' }> {
    return events.find((event) => event.type === 'turn.done') as Extract<BackendEvent, { type: 'turn.done' }>;
}

describe('Grok 1.0.62', () => {
    const failing = (error: unknown): AcpCapture => ({ ...grokLimits, promptError: error });

    test('ends a turn the free tier ran out on as a usage limit, with no reset since Grok names none', async () => {
        const done = turnDone(await turnOf(failing(grokLimits.errors.freeUsage)));
        expect(done).toMatchObject({ state: 'error', limit: { kind: 'usage' } });
        expect(done.limit?.resetsAt).toBeUndefined();
    });

    test('ends a rate limited turn as an overload, which the host tries again', async () => {
        expect(turnDone(await turnOf(failing(grokLimits.errors.rateLimited)))).toMatchObject({ state: 'error', limit: { kind: 'overload' } });
    });

    test('ends a turn on an overloaded model as an overload, by its status or by the error of its stream', async () => {
        expect(turnDone(await turnOf(failing(grokLimits.errors.overloaded)))).toMatchObject({ state: 'error', limit: { kind: 'overload' } });
        expect(turnDone(await turnOf(failing(grokLimits.errors.overloadedStream)))).toMatchObject({ state: 'error', limit: { kind: 'overload' } });
    });

    test('leaves any other failure a plain error', async () => {
        const done = turnDone(await turnOf(failing(grokLimits.errors.badRequest)));
        expect(done.state).toBe('error');
        expect(done.limit).toBeUndefined();
    });
});

describe('Antigravity 1.4.1', () => {
    test('ends the turn its quota ran out in as a usage limit, without the message in the thread', async () => {
        const events = await turnOf(antigravityQuota);
        expect(events.some((event) => event.type === 'text.delta' || event.type === 'text.done')).toBe(false);
        expect(turnDone(events)).toEqual({
            type: 'turn.done',
            promptId: 'prompt-1',
            costUsd: 0,
            state: 'error',
            error: antigravityQuota.promptUpdates[0]!.content.text,
            // Four days and 23 hours, and the hour the message leaves out.
            limit: { kind: 'usage', resetsAt: NOW + (4 * 24 + 23 + 1) * HOUR }
        });
    });

    test('reads a reset named as a time, and leaves the reset out when the message names none', () => {
        expect(quotaResetOf(antigravityQuota.resetOn, NOW)).toBe(Date.UTC(2026, 9, 23, 14, 6));
        expect(quotaResetOf(antigravityQuota.noReset, NOW)).toBeNull();
        expect(quotaResetOf('Your limit will reset in 5 minutes, 30 seconds.', NOW)).toBe(NOW + 5 * 60_000 + 31_000);
    });

    test('shows a message that only starts like the limit message, whole', async () => {
        const capture: AcpCapture = {
            ...antigravityQuota,
            promptUpdates: [
                { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'Usa' } },
                { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'ge is fine.' } }
            ]
        };
        const events = await turnOf(capture);
        expect(events.filter((event) => event.type === 'text.delta')).toEqual([{ type: 'text.delta', ref: 'message-1', text: 'Usage is fine.' }]);
        expect(turnDone(events)).toMatchObject({ state: 'done' });
    });
});
