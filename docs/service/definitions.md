# Definitions

A definition is the text of a launchd property list, a systemd unit or a Windows scheduled task, built from one `ServiceSpec`. Building one writes nothing and starts nothing.

```ts
import { definitionRunsProgram, launchAgentPlist, scheduledTask, systemdUnit, type ServiceSpec } from '@adecore/service/definitions';
import { serviceDefinition } from '@adecore/service/platform';
```

## ServiceSpec

Every field but `user` is required, also those only one platform reads.

| Field | Type | |
| --- | --- | --- |
| `label` | `string` | The launchd label. Pass the same one to the launchd manager. |
| `description` | `string` | The unit's `Description` and the task's. launchd ignores it. |
| `program` | `string` | The absolute path of the executable. |
| `args` | `string[]` | The arguments as the program receives them, without shell quoting. |
| `environment` | `Record<string, string>` | The whole environment. Nothing is taken from a login shell, so pass `PATH` if the program needs one. |
| `workingDirectory` | `string` | The folder the program starts in. |
| `logFile` | `string` | Where launchd and the scheduled task write stdout and stderr. systemd logs to the journal. |
| `user` | `string`, optional | The account a scheduled task starts for at logon, as `DOMAIN\name`. The task needs it; the others ignore it. |

The systemd unit is named by the manager's `unitName`, not by the spec.

## What the definitions hold

| Function | Returns |
| --- | --- |
| `launchAgentPlist(spec)` | A property list with `ProgramArguments`, `EnvironmentVariables`, `WorkingDirectory`, `RunAtLoad` and `KeepAlive` set to true, `ProcessType` set to `Interactive` so launchd does not throttle it, and both output streams to `logFile`. |
| `systemdUnit(spec)` | A unit with `Type=simple`, `ExecStart`, one `Environment` line per variable, `WorkingDirectory`, `Restart=always`, `RestartSec=2` and `WantedBy=default.target`. |
| `scheduledTask(spec)` | Task Scheduler XML with a `LogonTrigger` for `user`, an `InteractiveToken` principal at `LeastPrivilege`, no time limit, normal priority and `IgnoreNew` for a second instance. The trigger repeats every minute, which brings the program back within a minute after it ended, since `RestartOnFailure` only covers a start that failed. The action runs `cmd.exe` under `conhost.exe --headless`, which sets the environment, starts the program and appends both output streams to `logFile`, without a console window. Throws without `user`. |
| `serviceDefinition(platform, spec)` | The property list on `darwin`, the unit on `linux`, the task on `win32`. Throws on any other platform. |

A user unit stops when the person logs out, unless lingering is on; see [Lingering](/service/managers#lingering).

## Escaping

Pass every value unescaped. The property list escapes `&`, `<` and `>`. The unit quotes every word of `ExecStart` and every `Environment` assignment, escapes backslashes and quotes, and doubles `%` everywhere so systemd expands no specifier. `$` is doubled in `ExecStart` only, since systemd expands variables there and not in `Environment`. `WorkingDirectory` is written without quotes, because systemd reads the rest of that line as the path.

```ts
systemdUnit({ ...spec, description: 'Example worker 100%', program: '/opt/My Tools/worker', args: ['--label', 'a$b'], environment: { CACHE: '/home/ada/cache%/$HOME' } });
```

The unit then holds these lines:

```ini
Description=Example worker 100%%
ExecStart="/opt/My Tools/worker" "--label" "a$$b"
Environment="CACHE=/home/ada/cache%%/$HOME"
```

The task escapes every character `cmd.exe` reads as syntax with a caret, `%` included, quotes every argument as the C runtime splits a command line, and escapes `&`, `<` and `>` for XML. It refuses a line break in an argument, which `cmd.exe` would cut the line at.

None of the functions checks that the program exists, and only the task rejects a newline. Pass values the app trusts.

## Whose service it is

`definitionRunsProgram(definition, program)` tells whether a definition on disk runs `program`: as a `<string>` in the property list, as the first word of `ExecStart` in the unit, or as the command `cmd.exe` runs after setting the environment in the task. A path that only starts the same does not match. Read the existing definition before you install over it, and refuse when it runs another program, so an app never takes over a service of the same name that is not its own.

It searches text and parses neither format. In a property list it also matches the path in another field, such as an argument or the working folder.
