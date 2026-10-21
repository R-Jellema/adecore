/*
 * An ACP agent that answers with the frames a real one sent, recorded in a capture: its `initialize`, its
 * `session/new`, and every update of one prompt before the response. Every prompt gets the same turn, except
 * that a `session_info_update` carries the prompt's own text as its title, as Copilot CLI names a session.
 */
import type { FakeCli } from './fake-cli.ts';

type Frame = Record<string, unknown>;

export interface AcpCapture {
    sessionId: string;
    initialize: unknown;
    sessionNew: unknown;
    // The `available_commands_update` the agent sends before it answers `session/new`.
    commands: unknown[];
    setConfigOption: unknown;
    promptUpdates: unknown[];
    promptResponse: unknown;
}

export function fakeAcpCapture(capture: AcpCapture): FakeCli {
    return (io) => {
        const send = (frame: Frame): void => {
            io.out({ jsonrpc: '2.0', ...frame });
        };
        const update = (fields: unknown): void => {
            send({ method: 'session/update', params: { sessionId: capture.sessionId, update: fields } });
        };
        return {
            onLine: (line) => {
                const frame = JSON.parse(line) as Frame;
                const id = frame.id;
                switch (frame.method) {
                    case undefined:
                        return;
                    case 'initialize':
                        send({ id, result: capture.initialize });
                        return;
                    case 'session/new':
                        update({ sessionUpdate: 'available_commands_update', availableCommands: capture.commands });
                        send({ id, result: capture.sessionNew });
                        return;
                    case 'session/set_config_option':
                        send({ id, result: capture.setConfigOption });
                        return;
                    case 'session/set_mode':
                    case 'session/close':
                        send({ id, result: {} });
                        return;
                    case 'session/prompt': {
                        const blocks = Array.isArray((frame.params as Frame | undefined)?.prompt) ? ((frame.params as Frame).prompt as Frame[]) : [];
                        const text = blocks.find((block) => block.type === 'text')?.text;
                        for (const fields of capture.promptUpdates) {
                            const named = (fields as Frame).sessionUpdate === 'session_info_update';
                            update(named ? { ...(fields as Frame), title: text } : fields);
                        }
                        send({ id, result: capture.promptResponse });
                        return;
                    }
                    case 'session/cancel':
                        return;
                    default:
                        if (id !== undefined) {
                            send({ id, error: { code: -32601, message: `Method not found: ${String(frame.method)}` } });
                        }
                }
            }
        };
    };
}
