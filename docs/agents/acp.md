# ACP agents

The [Agent Client Protocol](https://agentclientprotocol.com) is JSON-RPC 2.0 over an agent's stdio. An agent that speaks version 1 of it becomes a provider through a spec. It needs no backend of its own: the chat, the thread and the wire are the same as for the built-in providers.

```ts
import { createAcpProvider, ModelCatalog } from '@adecore/agents/providers';

const exampleProvider = createAcpProvider({
    kind: 'example',
    name: 'Example',
    command: 'example',
    args: ['agent', 'stdio'],
    catalog: new ModelCatalog(exampleModels),
    modes: { supervised: ['default'], 'auto-accept-edits': ['accept-edits'], 'full-access': ['bypass'] },
    authMethod: 'api-key',
    loginHint: 'Run `example login` in a terminal.',
    capabilities: { reportsCost: true, reportsContextWindow: true }
});
```

Put it in the `ProviderRegistry` beside the others. A `kind` is any name the host picks.

## The spec

`AcpProviderSpec` is `AcpAgentSpec`, which is what the backend needs, plus what makes it a provider.

| Field | |
| --- | --- |
| `kind`, `name` | The provider's kind and the name a person reads, also in the notes and errors of the backend. |
| `command`, `args` | The executable and the arguments that start it as an ACP agent on its stdio. |
| `catalog` | The models a person picks from. The selection's slug is passed to the agent as its model id, unless `model(selection)` says otherwise; `null` from it leaves the agent its own choice. |
| `env` | Variables set over the launch's environment. |
| `modes` | The agent's own mode ids per runtime mode, best first (`AcpModeMap`). |
| `authMethod`, `loginHint` | The method `authenticate` is called with when the agent needs a login, and what the error says when there is no method. |
| `client` | How the host names itself in `initialize` (`AcpClientInfo`). |
| `onSession(info)` | What each session offers (`AcpSessionInfo`), for a host that fills its catalog from the agent. |
| `capabilities` | Over `ACP_CAPABILITIES`, for an agent that reports its cost or context window. |
| `resumeCommand`, `home`, `detect`, `oneShotArgs`, `oneShotStdinArgs`, `firstPromptArgs`, `enabled`, `ignoresProjectConfig` | As on any `ChatProvider`. Without `firstPromptArgs` the agent is offered as a chat only, and without `detect` the executable is asked for `--version`. |

A host that builds its `ChatProvider` by hand calls `createAcpBackend(spec)` for its `createBackend`.

## A session

`start` runs `initialize` and opens the session before the first turn. The client advertises no file system and no terminal, so the agent works with its own tools, and it passes no MCP servers. Only protocol version 1 is accepted.

A chat that has an agent session to continue resumes it with `session/resume` when the agent advertises `sessionCapabilities.resume`, and loads it with `session/load` when it advertises `loadSession`. The history a load replays is dropped, since the thread holds it already. An agent that advertises neither, or refuses the session, gets a new one and the thread a note that says so. `BackendLaunch.folders` go along as `additionalDirectories` only when the agent advertises them.

ACP has no system prompt. The launch's `instructions` go in front of the first prompt of a new session, and `resumeInstructions` and `resumeNote` in front of the first prompt of a resumed one.

When `session/new`, `session/load` or `session/resume` answers that authentication is required, the backend calls `authenticate` with `authMethod` and asks once more. Without one, the start fails with `loginHint`.

## Modes

The runtime mode picks the first id in `modes` the agent offers, through `session/set_mode`, or through `session/set_config_option` when the agent lists its modes as a config option of the `mode` category. A runtime mode the agent has no id for falls to the next narrower one, down to `supervised`, never to a wider one. If the agent already runs in a mode `modes` puts above the runtime mode and offers nothing narrower, the start fails.

The agent then asks with `session/request_permission` for what its mode does not allow. The backend answers part of that itself, so a runtime mode without a matching agent mode is still honored:

| Runtime mode | Answered with allow once, without asking |
| --- | --- |
| `supervised` | Nothing |
| `auto-accept-edits` | Tool kinds `read`, `search`, `think`, `edit`, `move` |
| `auto` | The same, and `fetch` |
| `full-access` | Everything |

Everything else becomes an approval in the thread.

## Turns, approvals and cancels

A turn is one `session/prompt` and ends on its response. `stopReason` maps onto the turn:

| `stopReason` | Turn |
| --- | --- |
| `end_turn` | Done |
| `cancelled` | Aborted |
| `max_tokens`, `max_turn_requests` | Done, with a warning note |
| `refusal` | Error |

A failed request ends the turn as an error and leaves the process running.

An approval offers allow, allow always and deny. Allow answers with the agent's `allow_once` option, allow always with `allow_always` (offered only when the agent has one), and deny with `reject_once` or `reject_always`. A decision without a matching option falls to the narrower one; a denial without any reject option answers `cancelled`.

`interrupt` answers every open permission request as `cancelled`, withdraws its approval and sends `session/cancel`. The turn ends when the agent answers the prompt, as the protocol asks.

## Updates

| `sessionUpdate` | Backend event |
| --- | --- |
| `agent_message_chunk` | `text.delta`, then one `text.done` per message. A new `messageId`, a thought, a tool call or the end of the turn closes it. Images and resources in a message are left out. |
| `agent_thought_chunk` | `thinking.delta` and `thinking.done` |
| `tool_call`, `tool_call_update` | `tool.started`, again whenever an update changes the row, and `tool.done` once the call is `completed` or `failed`. The kind names the row (`execute` is `Bash`, `read` is `Read`, `search` is `Grep`, `fetch` is `WebFetch` or `WebSearch`). A diff of one file draws as `Edit`, `Write` or `MultiEdit` from the text before and after; diffs of several files as unified changes. |
| `plan` | A `TodoWrite` row with the whole plan |
| `available_commands_update` | The chat's slash commands |
| `current_mode_update` | `permissions`, with the runtime mode `modes` puts that agent mode under |
| `config_option_update` | `model` and `permissions` for the model and mode options |
| `usage_update` | `usage` with the context tokens and window, and the cost when it is in USD |
| `session_info_update` | `title` |

Any other update, and any field the backend does not know, is ignored. A request of the agent the backend does not handle (the file system and terminal methods among them) is answered with "method not found".

## Models

`AcpSessionInfo.models` holds the models a session offers: a config option of the `model` category, or the `models` field agents sent before config options. The backend switches to the selected model through the option, or through `session/set_model` for the older field. A model the agent does not offer leaves the agent its own, with a note. The `effort` option of a selection sets a `thought_level` config option when the agent offers that value.

A host that wants its catalog from the agent reads `onSession`; otherwise it ships the catalog itself.

## What it leaves out

Usage readers and plan limits, the file system and terminal client capabilities, MCP servers for the agent, elicitations, notices and compaction updates. ACP has no call to fold the context, so `compaction` is `none`; an agent with a command for it can set `compaction: 'prompt'`. The test fakes in `@adecore/agents/testing` include `fakeAcp`, an agent for backend tests.
