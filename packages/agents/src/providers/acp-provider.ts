import type { AgentKind, ProviderCapabilities, ProviderInstall } from '@adecore/agent-contracts';
import { createAcpBackend, type AcpAgentSpec } from '../chat/acp-backend.ts';
import type { AcpSessionInfo } from '../chat/acp-protocol.ts';
import { askAcpAccount } from './accounts/acp-account.ts';
import type { ModelCatalog } from './catalog.ts';
import { detectCli, type CliDetection } from './detect.ts';
import type { ChatProvider, ProviderHome } from './provider.ts';

/*
 * What every ACP agent can do through this backend. A file change comes as the text before and after;
 * a message names its mentions and attachments by path, as text the agent opens with its own tools.
 */
export const ACP_CAPABILITIES: ProviderCapabilities = {
    chat: true,
    terminal: false,
    hooks: false,
    streamsToolOutput: false,
    diffs: 'before-after',
    attachments: true,
    mentions: true,
    denyReason: false,
    allowAlways: true,
    asyncQuestions: false,
    compaction: 'none',
    reportsCost: false,
    reportsContextWindow: false,
    reportsThinking: true,
    slashCommands: true
};

/* One ACP agent as a host offers it: the backend's spec, plus what makes it a provider. */
export interface AcpProviderSpec extends AcpAgentSpec {
    kind: AgentKind;
    // The executable, and the arguments that start it as an ACP agent on its stdio.
    command: string;
    args?: readonly string[];
    catalog: ModelCatalog;
    // Over `ACP_CAPABILITIES`, for an agent that reports its cost or context window, or whose commands fold its context.
    capabilities?: Partial<ProviderCapabilities>;
    // What a terminal runs to continue one of its sessions; empty where it has none.
    resumeCommand?: string;
    home?: ProviderHome;
    install?: ProviderInstall;
    ignoresProjectConfig?: boolean;
    oneShotArgs?(prompt: string): string[];
    oneShotStdinArgs?: readonly string[];
    // Absent leaves the agent to chats only.
    firstPromptArgs?(prompt: string): string[];
    // Absent asks the executable for `--version`.
    detect?(command: string, env: Record<string, string | undefined>): Promise<CliDetection>;
    enabled?(): boolean;
    // Absent or true asks the agent over ACP whether an account is signed in; false leaves that to the host.
    accountProbe?: boolean;
    // Absent or true lets the models a session reports replace the catalog's; false keeps the catalog as the host built it.
    adoptModels?: boolean;
}

/* An agent's model id may reach a command line, so one that reads as a flag is left out. */
function adoptableModels(info: AcpSessionInfo): Array<{ slug: string; name: string }> {
    return (info.models?.models ?? []).filter((model) => model.id !== '' && !model.id.startsWith('-')).map((model) => ({ slug: model.id, name: model.name }));
}

export function createAcpProvider(spec: AcpProviderSpec): ChatProvider {
    const capabilities = { ...ACP_CAPABILITIES, ...spec.capabilities };
    const onSession = (info: AcpSessionInfo): void => {
        if (spec.adoptModels !== false && info.models !== null) {
            spec.catalog.adopt(adoptableModels(info), info.models.current);
        }
        spec.onSession?.(info);
    };
    return {
        kind: spec.kind,
        name: spec.name,
        catalog: spec.catalog,
        capabilities,
        command: [spec.command, ...(spec.args ?? [])],
        resumeCommand: spec.resumeCommand ?? '',
        ...(spec.ignoresProjectConfig === undefined ? {} : { ignoresProjectConfig: spec.ignoresProjectConfig }),
        ...(spec.home ? { home: spec.home } : {}),
        ...(spec.install ? { install: spec.install } : {}),
        ...(spec.oneShotArgs ? { oneShotArgs: spec.oneShotArgs } : {}),
        ...(spec.oneShotStdinArgs ? { oneShotStdinArgs: spec.oneShotStdinArgs } : {}),
        ...(spec.enabled ? { enabled: spec.enabled } : {}),
        firstPromptArgs:
            spec.firstPromptArgs ??
            (() => {
                throw new Error(`${spec.name} is only available as a chat.`);
            }),
        detect: spec.detect ?? ((command, env) => detectCli(command, env)),
        ...(spec.accountProbe === false
            ? {}
            : {
                  askAccount: (command, env) =>
                      askAcpAccount({
                          name: spec.name,
                          command,
                          env: { ...env, ...spec.env },
                          ...(spec.client ? { client: spec.client } : {}),
                          onSession
                      })
              }),
        createBackend: createAcpBackend({ ...spec, onSession })
    };
}
