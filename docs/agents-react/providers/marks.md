# Agent marks

The marks of the agent CLIs and the dot of an account's color.

<Demo src="agents/marks" />

| Component                                   | Import                   |                                                                                               |
| ------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `AgentIcon({ kind, size?, className? })`    | `@adecore/agents-react/providers` | The mark of an `AgentKind` in the current text color, with a label for screen readers. A kind without a mark gets a robot. |
| `CliMark({ kind, size?, className? })`      | `@adecore/agents-react/providers` | The same mark in the CLI's chart color, so it matches the usage page.                         |
| `CliTile({ kind })`                         | `@adecore/agents-react/providers` | A 24 pixel mark as tall as a title's first line, for a list row.                              |
| `ProviderLogo({ provider, size?, className? })` | `@adecore/agents-react/providers` | The mark of a `UsageProvider`, decorative.                                                    |
| `AccountDot({ color, className? })`         | `@adecore/agents-react/providers` | An account's color: one of the host's `accents` by id, or the app's accent for any other.     |

`size` is in pixels, 14 by default. Every mark comes from `@adecore/agents-react/providers`.

## A mark for a kind the host adds

`AgentIcon` knows the marks of the built-in kinds. A host that offers a kind of its own, such as one it runs through [`createAcpProvider`](/agents/acp), gives it a mark once with `configureAgentMarks` from `@adecore/agents-react`, before the first render and beside `configureChatStorage`. Every place that draws an agent's mark takes it from there: the pickers, the thread, the welcome, the run settings, the task rows and the providers pane.

```ts
import { configureAgentMarks } from '@adecore/agents-react';

configureAgentMarks({
    acme: { title: 'Acme', path: 'M12 2 2 22h20Z' },
    orbit: { title: 'Orbit', path: 'M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1Z', viewBox: '0 0 16 16' }
});
```

An `AgentMark` is one SVG path (`path`, several shapes in one `d`) drawn in `currentColor`, with a `title` for screen readers and the box it was drawn in (`viewBox`, `0 0 24 24` when absent). A mark given for a built-in kind replaces the built-in one; a kind with no mark at all is drawn as a robot. A later call replaces the whole set.
