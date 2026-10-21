export default {
    status: {
        checking: 'Checking',
        disabled: 'Turned off',
        notFound: 'CLI not found',
        signedOut: 'Not logged in',
        ready: 'Logged in',
        readyPlan: 'Logged in · {{plan}}',
        available: 'Ready',
        folderMissing: 'Folder missing',
        unavailable: 'Not available',
        failed: 'Check failed'
    },
    failed: 'The provider settings failed to render',
    list: {
        label: 'Agent CLIs and their accounts',
        default: 'Default',
        ready: 'Ready',
        needsSetup: 'Needs setup',
        signedOut: 'Signed out',
        addAccount: 'Add a {{provider}} account',
        addProvider: 'Add provider',
        notInstalled: 'Not installed',
        missing: 'Missing',
        notInstalledNote: 'Install one on this machine to use it here.',
        none: 'No agent CLIs found on this machine.',
        noAccounts: 'This machine keeps no accounts yet. Update Ruimte there to add one.'
    },
    install: {
        notInstalled: 'Not installed',
        steps: 'Steps to set up {{provider}}',
        platform: 'System',
        platforms: {
            darwin: 'macOS',
            linux: 'Linux',
            win32: 'Windows'
        },
        copy: 'Copy',
        copied: 'Copied',
        run: 'Run in a terminal',
        guide: 'Install guide',
        install: {
            title: 'Install the CLI',
            none: 'There is no install command for this system.',
            done: 'Installed, version {{version}}.',
            doneNoVersion: 'Installed.'
        },
        signIn: {
            title: 'Sign in',
            command: 'Run this in a terminal and follow its steps:',
            env: 'Set <code>{{variable}}</code> in the environment the CLI starts in.',
            chat: 'The first chat asks you to sign in.',
            or: 'Or',
            unknown: 'The CLI asks you to sign in the first time it runs.'
        },
        start: {
            title: 'Start working',
            description: 'Pick {{provider}} for your next chat or terminal.'
        },
        footer: {
            missing: 'Not found on this machine yet. It is checked again when you come back to this window.',
            found: 'Found on this machine.'
        },
        fallback: 'Install {{provider}} on this machine to use it here.'
    },
    abilities: {
        version: 'Version {{version}}.',
        chatAndTerminal: 'Chat and terminal.',
        terminalOnly: 'Terminal only.',
        reportsStatus: 'Reports agent status.',
        noStatus: 'Does not report agent status.'
    },
    cli: {
        addAccount: 'Add account',
        onlyDefault: '{{provider}} has no setting for its config folder, so it has only its default account.',
        defaults: {
            title: 'Defaults for new chats',
            description: 'Picking a model or account in a chat also changes its default here.',
            account: 'Account',
            accountFor: 'Default account for {{provider}}',
            model: 'Model',
            modelFor: 'Default model for {{provider}}',
            shared: 'Shared by every {{provider}} account.',
            usesCliDefault: "Uses the CLI's own default model.",
            providerDefault: 'Provider default',
            legacyModel: '{{name}} (legacy)'
        },
        accounts: 'Accounts'
    },
    account: {
        kind: '{{provider}} account',
        enabled: {
            label: 'Use this account',
            description: 'Turned off, it is not offered for new chats and agents.'
        },
        showFolder: 'Show folder',
        folderCopied: 'Folder path copied',
        name: 'Name',
        color: 'Color',
        login: {
            title: 'Login',
            signedInAs: 'Logged in as {{email}}',
            signedIn: 'Logged in',
            planDetail: "{{plan}} plan. Log in again opens a terminal with the CLI's own login.",
            detail: "Log in again opens a terminal with the CLI's own login.",
            signedOut: 'Not logged in',
            signedOutDetail: "Opens a terminal that runs the CLI's login with this folder.",
            logIn: 'Log in',
            logInAgain: 'Log in again',
            inChat: 'Logs in from a chat',
            inChatDetail: 'The first chat on this account asks you to log in, and the CLI keeps that login in this folder.'
        },
        folder: {
            label: 'Folder',
            detail: 'Given to the CLI as <code>{{variable}}</code>. The CLI keeps its own login, settings and history here.',
            detailPlain: 'The CLI keeps its own login, settings and history here.'
        },
        variables: {
            title: 'Variables',
            description: 'Extra environment for this account only. Sensitive values stay in the keychain.',
            add: 'Add variable',
            name: 'Name of variable {{index}}',
            value: 'Value of {{name}}',
            kept: 'Kept in the keychain',
            lock: 'Keep {{name}} in the keychain',
            unlock: 'Store {{name}} as plain text',
            noKeychain: 'This machine has no keychain, so a value cannot be kept secret.',
            remove: 'Remove {{name}}',
            none: 'No variables',
            discard: 'Discard',
            problem: {
                noName: 'Every variable needs a name.',
                invalidName: '{{name}} is not a variable name.',
                duplicate: '{{name}} is set twice.',
                noValue: '{{name}} needs a value.'
            }
        },
        remove: {
            label: 'Remove account',
            description: 'Chats that use it ask for another account on their next turn. The folder stays on disk.',
            defaultNote: "The default account uses the CLI's own folder and cannot be removed. Turn it off above instead.",
            button: 'Remove',
            confirmTitle: 'Remove {{account}}?',
            confirmDescription: 'Ruimte forgets this account. Its folder stays on disk at {{folder}}, with its login in it.',
            confirm: 'Remove account'
        },
        saveFailed: 'Could not save the account'
    },
    add: {
        title: 'Add a {{provider}} account',
        description: 'Ruimte makes a folder for it on the machine, then opens a terminal where you log in.',
        chatDescription: 'A folder is made for it on the machine. The first chat on it asks you to log in.',
        name: 'Name',
        namePlaceholder: 'Work',
        color: 'Color',
        advanced: 'Advanced',
        link: {
            label: 'Link an existing folder',
            description: 'Use a config folder that is already on the machine instead of a new one. Ruimte never moves or deletes it.',
            placeholder: 'Path on the machine'
        },
        create: 'Add account',
        linkButton: 'Link folder',
        failed: 'Could not add the account'
    },
    section: {
        label: 'Providers',
        description: 'The agent CLIs on this machine and the accounts they sign in with.'
    },
    notAnswering: 'Not answering. Change this once the machine is back.',
    common: {
        save: 'Save',
        cancel: 'Cancel'
    }
};
