import type { AgentKind, ProviderCapabilities, ProviderInstall } from '@adecore/agent-contracts';
import { createAcpBackend, type AcpAgentSpec } from '../chat/acp-backend.ts';
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
}

export function createAcpProvider(spec: AcpProviderSpec): ChatProvider {
    const capabilities = { ...ACP_CAPABILITIES, ...spec.capabilities };
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
        createBackend: createAcpBackend(spec)
    };
}
