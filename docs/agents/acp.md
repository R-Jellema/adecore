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
| `onUsage(report)` | The tokens of every turn whose response reports them (`AcpUsageReport`), with the session, folder and model it ran in. |
| `usageLog` | A folder the provider logs every such turn to, for the usage page. See [Usage](#usage). |
| `autoAllow(request)` | Answers a permission request without asking the person, in any runtime mode. See [Calls the host guards](#calls-the-host-guards). |
| `accountProbe` | `false` leaves the provider without `askAccount`, so the host's own reader asks about its accounts. |
| `adoptModels` | `false` keeps `catalog` as the host built it instead of taking the models a session reports. |
| `catalogStore` | Where the provider keeps what the agent reported, so a host that starts again offers it at once (`AcpCatalogStore`). See [Models](#models). |
| `onContextReport()` | Called once per process, at the first `usage_update` that names the context window. |
| `capabilities` | Over `ACP_CAPABILITIES` and what the agent showed it can do (see [Capabilities](#capabilities)), for what the host knows better. |
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

## Calls the host guards

A host that already checks some calls itself, such as its own command line tool, passes `autoAllow`. The backend calls it for every permission request the runtime mode does not answer, in every runtime mode, with an `AcpPermissionRequest`: the tool `kind`, the `title`, and in `commands` every text that may be what the call runs, the `command` of its raw input and each text in its content. True answers the request with the agent's allow once option, never allow always; the call shows in the thread as any other, and no approval appears. False, or a throw, leaves it to the person.

`isOnlyCommands(command, allowed)` from `@adecore/agents/providers` answers whether a command line is only simple commands, joined by `&&`, `||`, `;` or newlines, each of which starts with a word in `allowed`. Quotes and backslash escapes are read as a shell reads them. Anything it cannot prove simple answers false: a pipe, a redirect or here-doc, command, process or variable substitution, a subshell or group, a background `&`, an unquoted glob, brace, tilde, comment or `!`, an unbalanced quote, and an empty command between separators.

```ts
const spec: AcpProviderSpec = {
    // ...
    autoAllow: (request) => request.kind === 'execute' && request.commands.length > 0 && request.commands.every((command) => isOnlyCommands(command, ['my-tool', 'echo']))
};
```

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

`AcpSessionInfo.models` holds the models a session offers: a config option of the `model` category, or the `models` field agents sent before config options. The backend switches to the selected model through the option, or through `session/set_model` for the older field. A model the agent does not offer leaves the agent its own, with a note. `AcpSessionInfo.thoughtLevel` holds the reasoning effort as an `AcpThoughtLevel`, its values as `AcpChoice` entries: a select config option of the `thought_level` category, or one with the id `reasoning_effort` from an agent that sets no category. After the model the backend sets the `effort` option of a selection through it, against the values the response to the model switch reports, since an agent may offer other efforts per model. A value the agent does not offer for the model is skipped, and an agent that refuses one leaves a note and keeps its own.

The provider takes the models a session reports into its `catalog` (`ModelCatalog.adopt`): the agent's current model becomes the default, the others follow in the agent's order under the names it gives them, and each gets the profile the catalog's default had. A reasoning effort the session reports becomes that profile's `effort` option, the one the composer draws for every provider: the agent's names as labels and its current value as the default. ACP reports the effort only for the model a session runs, so every adopted model gets it. A model id that starts with a dash is left out, as it could pass for a flag. A session that reports no models leaves the catalog as it was, so the host's catalog is the fallback. A session is opened by every chat and by every account check, so the list is there before the first chat. Set `adoptModels: false` to keep the host's catalog; `onSession` still sees every session. The provider calls the listeners of `onChange` whenever the models change, and `ProviderRegistry.onChange` passes that on with the provider's kind, so a host can hand its clients the new list.

With `catalogStore` the provider saves what the agent reported each time it changes, and a provider made with the same store starts from it, before any session ran. `load()` answers what `save(value)` was last given; the value is the provider's own and only needs to survive as JSON. A part of it the provider cannot read is skipped, and a store that throws costs only what it would have kept.

```ts
const store: AcpCatalogStore = {
    load: () => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null),
    save: (value) => writeFileSync(file, JSON.stringify(value))
};
```

## Capabilities

A provider starts from `ACP_CAPABILITIES` and lays over it what its agent showed, in sessions and account checks alike; `capabilities` from the spec goes over both. What the agent showed is kept in `catalogStore` with the models, and a change calls the listeners of `onChange`. The object stays the same one, changed in place, so a host that spread the provider into a value of its own still reads the current capabilities.

| The agent | Capability |
| --- | --- |
| Sends a `usage_update` with its context window | `reportsContextWindow: true` |

A model whose entry carries `_meta.totalContextTokens`, a field some agents add outside the protocol, gets that size as its context window in the catalog, so the meter has a size before the first `usage_update`.

## Usage

A `session/prompt` response may carry `usage`, a part of the protocol that is still unstable. The backend reads it into `AcpTurnUsage`, with the kinds of token apart as a usage record keeps them. The protocol does not say whether `inputTokens` holds the cached part, so the total decides: when input, output and both cache kinds add up to more than `totalTokens`, the cache is taken out of the input. Thought tokens are kept as `reasoning`, a part of `output`. A cancelled turn still reports what it spent.

The backend hands every turn with usage to `onUsage`. With `usageLog`, the provider also appends it as a `hostUsageLine` to a file per session in that folder, so the scanner reads it like any host log: the host adds a root for the folder with the provider it logs the agent under, which has to be one of `USAGE_PROVIDERS`. An agent whose own usage files the scanner reads (Grok) logs nothing, whatever `usageLog` says, so no turn is counted twice. The `usage_update` notification is the context window and the session's cost, not the tokens of a turn, so it is never logged.

## Accounts

ACP has no request that says who is signed in, so `askAccount` asks by opening a session: `askAcpAccount` starts the agent in the account's environment, runs `initialize` and then `session/new` in an empty temporary folder with no MCP servers. A session means signed in; an answer with the "authentication required" code (`-32000`) means signed out. Any other error, an exit or no answer within 20 seconds fails the check with a short message. The probe never calls `authenticate`, since that could start a login. It closes the session with `session/close` when the agent advertises `sessionCapabilities.close`, then ends the process and its children and removes the folder. An agent that cannot close a session may keep an empty one in its history.

A reading carries no email or plan: `initialize` names the agent, not the person. `askAcpAccount` also takes a `spawn` and a `timer` (`ProbeTimer`), for a test that runs a fake agent on a clock of its own.

## What it leaves out

Plan limits, the file system and terminal client capabilities, MCP servers for the agent, elicitations, notices and compaction updates. ACP has no call to fold the context, so `compaction` is `none`; an agent with a command for it can set `compaction: 'prompt'`. The test fakes in `@adecore/agents/testing` include `fakeAcp`, an agent for backend tests, and `fakeAcpWith`, which can also require a login (`authMethod`), advertise `session/close` (`closeSession`) or report `usage` on every prompt response (`turnUsage`).
