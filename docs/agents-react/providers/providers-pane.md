# ProvidersPane

The agent CLIs of a host and the accounts they sign in with: a list on the left, the picked CLI or account on the right. It is a settings pane, made to sit in the `SettingsDialog` of `@adecore/ui`, and it reads the host from the scope it is rendered in.

```tsx
import { ProvidersPane } from '@adecore/agents-react/providers';
```

<Demo src="agents/providers-pane" />

A CLI shows its version and what it can do, the model and options a new chat of it starts with, and its accounts. An account shows its state as the CLI reported it, its name, color, folder and environment variables, a way to sign in and a way to remove it. The plus beside a CLI adds an account: in a folder the host makes, or under Advanced in one that exists. A CLI that is not installed is listed under the others without accounts, and picking it opens its install page.

The pane needs the scope's accounts, so run `watchProviderAccounts(scopeId, transport)` for the scope; see [Getting started](/agents-react/guide/getting-started#a-scope). Signing in runs the CLI's own login through the host's `openLogin`; without one there is no button. A CLI whose provider has a `home` without a `loginCommand` signs in from its first chat: it still gets the plus, its new account gets a folder of its own, and the account says that the chat asks for the login instead of offering a terminal. The host checks every save itself and refuses what it does not allow, such as a variable it reserves.

## Props

| Prop            | Type                                                      |                                                                                                                                             |
| --------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`        | `string \| null`                                          | The `searchId` of a settings search result; the pane opens on its CLI. `providers.install.<kind>` opens on a CLI's install page; see below. |
| `detailOf`      | `(provider: ProviderInfo) => ReactNode \| null`           | A detail of your own for a CLI; `null` draws the usual one.                                                                                 |
| `defaults`      | `boolean`                                                 | Shows what a new chat starts with. `true` by default; pass `false` when your app decides that elsewhere.                                    |
| `installStepOf` | `(provider: ProviderInfo) => ProviderInstallStep \| null` | A step of your own on a CLI's install page, after its install; `null` adds none.                                                            |

## Install page

A CLI the host reports with `installed: false` and an `install` field (see [Providers](/agent-contracts/providers-and-accounts#providers)) gets a page of numbered steps: install the CLI, sign in, start working. The current step is outlined in the accent, a step that is done has a check, and a later one is muted.

The first step offers a command per system the provider lists and opens on the system of the scope's machine, from the host's `useMachinePlatform`, or the page's when the host does not say. Each command has a Copy button. A "Run in a terminal" button is there only when the host has `runProviderCommand`, and the install guide only when the provider has a `guideUrl`. The sign-in step names each of the provider's `signIn` ways; after a key in the environment it adds the host's `providerKeyNote`, if any. See [the host](/agents-react/guide/host).

The page says the CLI was not found yet and that it is checked again when the person comes back. Checking again is the host's: report the provider anew and the page follows, with the version in the header and the first step done. Once the CLI is installed, signed in and any step of your own is done, the pane shows the CLI's usual detail. A host that sends no `install` gets a short note in place of the steps.

To send a person straight to that page, from a note that a CLI is missing for example, pass `target="providers.install.<kind>"` with the provider's `kind`. The pane opens on the install page, the same one picking the CLI under "Not installed" opens. A CLI that is already installed opens on its usual detail instead, and one the host has not reported yet is taken as missing.

```tsx
<ProvidersPane target="providers.install.example" />
```

A CLI whose chat needs more than the CLI, such as a server your app installs beside it, gets that as a step of its own through `installStepOf`. Hand back a `ProviderInstallStep`: its `title`, whether it is `done`, and the `body` you draw under the title. The page numbers it, places it after the install and holds sign-in back until it is done.

```tsx
<ProvidersPane
    installStepOf={(provider) => (provider.kind === 'example' ? { title: 'Install the chat server', done: server.installed, body: <ServerInstall /> } : null)}
/>
```

## In the settings dialog

`settingsSection(section, Pane)` makes the entry the dialog takes, with the words read when the dialog draws. `PROVIDERS_SECTION` is this pane's section and `USAGE_SECTION` the one of [`UsagePane`](/agents-react/usage/usage-page#usagepane).

```tsx
import { SettingsDialog, useSettingsTarget } from '@adecore/ui/settings';
import { PROVIDERS_SECTION, settingsSection } from '@adecore/agents-react';

function ProvidersSettings() {
    const { target } = useSettingsTarget();
    return <ProvidersPane target={target} />;
}

<SettingsDialog groups={[{ label: null, sections: [settingsSection(PROVIDERS_SECTION, ProvidersSettings)] }]} {...dialogProps} />;
```

Keep the pane component the same between renders, or its forms start over.

## Parts and actions

The detail and its forms are internal to the package. Saving the accounts sends the whole map and shows a toast through the chat host's `notify` when the host of chats refused. Adding an account asks the host for one in a folder it makes, or links a folder that exists. Removing one forgets the account and leaves its folder; a new chat that was to use it goes back to the CLI's default account.

`accountsOfKind` and `accountStatusLine` read the accounts of a CLI for a list of your own. `providerAbilities(provider)` says in words where a CLI opens and whether it reports its status.
