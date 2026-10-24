import { useState, type ComponentType } from 'react';
import {
    ArrowUp,
    Bell,
    ChevronDown,
    Ellipsis,
    FileLock,
    FolderGit2,
    FolderOpen,
    GitBranch,
    GitCommitHorizontal,
    GitPullRequestArrow,
    Info,
    Keyboard,
    Monitor,
    Palette,
    Plus,
    RefreshCw,
    Sparkles,
    SquareTerminal,
    Upload,
    UserRound
} from 'lucide-react';
import type { UsageProvider } from '@adecore/agent-contracts';
import { ProviderLogo } from '@adecore/agents-react/providers';
import {
    Button,
    ButtonGroup,
    Checkbox,
    FileTree,
    Icon,
    IconButton,
    Input,
    ListRow,
    Menu,
    PanelHeader,
    Pill,
    SectionLabel,
    Segmented,
    Select,
    SplitButton,
    Stepper,
    Switch,
    TextArea,
    Tile,
    Tooltip,
    shortcut,
    useFileTree
} from '@adecore/ui';
import { SettingsDialog, SettingsRow, SettingsSection, TopIcon } from '@adecore/ui/settings';
import ChatDemo from '../../../../docs/demos/agents/chat.tsx';
import { Section, Specimen } from '../layout.tsx';
import { HELD } from '../held.ts';
import { usePinned } from '../pinned.ts';

const ignore = (): void => {};

const CHANGED = [
    'src/components/Button.tsx',
    'src/components/SplitButton.tsx',
    'src/components/field.css',
    'src/theme.css',
    'docs/buttons.md',
    'assets/',
    'package.json'
];

const STATUS = [
    { path: 'src/components/Button.tsx', status: 'modified' as const },
    { path: 'src/components/SplitButton.tsx', status: 'modified' as const },
    { path: 'src/components/field.css', status: 'added' as const },
    { path: 'src/theme.css', status: 'modified' as const },
    { path: 'docs/buttons.md', status: 'deleted' as const },
    { path: 'package.json', status: 'modified' as const }
];

const STATS: Record<string, string> = {
    'src/components/Button.tsx': '+12 -4',
    'src/components/SplitButton.tsx': '+3 -3',
    'src/components/field.css': '+48',
    'src/theme.css': '+9 -2',
    'docs/buttons.md': '-31',
    'package.json': '+1 -1'
};

const COMMITS = [
    { hash: 'a1c9e2f', message: 'Draw the secondary button like a field', when: '2 min' },
    { hash: '4d02b7a', message: 'Give fields a ground of their own', when: '1 h' },
    { hash: '9fe13c0', message: 'Lighten the sunken surface', when: '3 h' },
    { hash: '1b77d40', message: 'Keep the hover of an edged row inside its border', when: 'Yesterday' }
];

function ChangesTree() {
    const [staged, setStaged] = useState<ReadonlySet<string>>(new Set(['src/components/Button.tsx', 'src/theme.css']));
    const { model } = useFileTree({ paths: CHANGED, initialExpansion: 'open', flattenEmptyDirectories: true, gitStatus: STATUS });
    return (
        <FileTree.Root
            model={model}
            label="Changes"
            fitContent
            highlight="button"
            emptyLabel={() => 'Empty folder'}
            rowIcon={(row) => (row.path === 'package.json' ? FileLock : undefined)}
            renderControl={(row) =>
                row.kind === 'file' ? (
                    <FileTree.Checkbox
                        label={`Stage ${row.path}`}
                        checked={staged.has(row.path)}
                        onCheckedChange={(checked) =>
                            setStaged((current) => {
                                const next = new Set(current);
                                if (checked) {
                                    next.add(row.path);
                                } else {
                                    next.delete(row.path);
                                }
                                return next;
                            })
                        }
                    />
                ) : null
            }
            renderDecoration={(row) => (STATS[row.path] ? <span className="font-mono text-xs text-text-faint">{STATS[row.path]}</span> : null)}
        />
    );
}

function CommitBox() {
    const [amend, setAmend] = useState(false);
    return (
        <div className="flex shrink-0 flex-col gap-2 p-2">
            <div className="flex items-center gap-1.5 px-1 text-xs text-text-muted">
                <Icon icon={FolderGit2} size={12} className="shrink-0 text-text-faint" />
                <span className="truncate">adecore</span>
            </div>
            <div className="flex flex-col rounded-lg border border-field-border bg-field has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:-outline-offset-1 has-[textarea:focus-visible]:outline-accent">
                <TextArea variant="bare" size="sm" rows={3} aria-label="Commit message" placeholder="Commit message" />
                <div className="flex items-center gap-2 p-1.5">
                    <IconButton icon={Sparkles} label="Write a message" size="xs" />
                    <label className="flex items-center gap-2 text-sm text-text">
                        <Checkbox label="Amend" checked={amend} onCheckedChange={setAmend} /> Amend
                    </label>
                    <span className="grow" />
                    <SplitButton
                        variant="primary"
                        size="sm"
                        menuLabel="More ways to commit"
                        menu={
                            <Menu.Item>
                                <Icon icon={ArrowUp} size={14} /> Commit and push
                            </Menu.Item>
                        }
                    >
                        Commit 2 files
                    </SplitButton>
                </div>
            </div>
        </div>
    );
}

function CommitLog() {
    return (
        <div className="flex flex-col gap-1 border-t border-border p-2">
            <SectionLabel className="px-1">History</SectionLabel>
            {COMMITS.map((commit, index) => (
                <ListRow
                    key={commit.hash}
                    variant="inset"
                    className={index === 0 ? 'gap-2 bg-surface-active text-xs text-text' : 'gap-2 text-xs text-text hover:bg-surface-hover'}
                >
                    <Icon icon={GitCommitHorizontal} size={14} className="shrink-0 text-text-faint" />
                    <span className="truncate">{commit.message}</span>
                    <span className="ml-auto shrink-0 font-mono text-text-faint">{commit.hash}</span>
                    <span className="w-16 shrink-0 text-right text-text-faint">{commit.when}</span>
                </ListRow>
            ))}
        </div>
    );
}

function GitPanel() {
    return (
        <aside className="flex w-[380px] shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
            <PanelHeader>
                <Pill shape="tag" mono onClick={ignore}>
                    <Icon icon={GitBranch} size={12} /> feature/fields <Icon icon={ChevronDown} size={12} />
                </Pill>
                <span className="grow" />
                <SplitButton
                    size="sm"
                    tooltip="Push 3 commits"
                    menuLabel="Push one repository"
                    menu={
                        <>
                            <Menu.Item>adecore</Menu.Item>
                            <Menu.Item disabled>docs</Menu.Item>
                        </>
                    }
                >
                    <Icon icon={Upload} size={14} /> 3
                </SplitButton>
                <Menu.Root>
                    <IconButton icon={Ellipsis} label="More" size="sm" render={<Menu.Trigger />} />
                    <Menu.Popup align="end">
                        <Menu.Item>
                            <Icon icon={RefreshCw} size={14} /> Refresh
                        </Menu.Item>
                    </Menu.Popup>
                </Menu.Root>
            </PanelHeader>
            <div className="px-1 pt-1">
                <ChangesTree />
            </div>
            <CommitBox />
            <CommitLog />
        </aside>
    );
}

function GeneralPane() {
    const [name, setName] = useState('Studio');
    const [restore, setRestore] = useState(true);
    const [shell, setShell] = useState('zsh');
    const [font, setFont] = useState(13);
    const [density, setDensity] = useState('comfortable');
    return (
        <>
            <SettingsSection title="Project" description="What this project is called and where its work runs." tag={<Pill shape="tag">This Mac</Pill>}>
                <SettingsRow label="Name" control={<Input size="sm" className="w-56" value={name} onChange={(event) => setName(event.target.value)} />} />
                <SettingsRow
                    label="Shell"
                    description="New terminals start in it."
                    leading={<TopIcon icon={SquareTerminal} className="text-text-faint" />}
                    control={
                        <Select
                            label="Shell"
                            value={shell}
                            onValueChange={setShell}
                            items={[
                                { value: 'zsh', label: 'zsh' },
                                { value: 'bash', label: 'bash' },
                                { value: 'fish', label: 'fish' }
                            ]}
                        />
                    }
                />
                <SettingsRow
                    label="Open what was open last time"
                    control={<Switch label="Open what was open last time" checked={restore} onCheckedChange={setRestore} />}
                />
                <SettingsRow indent label="Include terminals" control={<Switch label="Include terminals" checked={false} onCheckedChange={ignore} />} />
            </SettingsSection>
            <SettingsSection
                title="Editor"
                action={
                    <Button size="sm" variant="secondary">
                        Reset
                    </Button>
                }
                footer="Applies to every project on this machine."
            >
                <SettingsRow
                    label="Font size"
                    control={<Stepper label="Font size" value={font} onValueChange={setFont} min={10} max={24} step={1} unit="px" />}
                />
                <SettingsRow
                    label="Density"
                    control={
                        <Segmented
                            label="Density"
                            size="sm"
                            value={density}
                            onValueChange={setDensity}
                            options={[
                                { id: 'compact', label: 'Compact' },
                                { id: 'comfortable', label: 'Comfortable' }
                            ]}
                        />
                    }
                />
                <SettingsRow muted label="Ligatures follow the font" />
            </SettingsSection>
        </>
    );
}

function EmptyPane() {
    return <p className="text-sm text-text-muted">Another pane.</p>;
}

const SETTINGS_GROUPS = [
    {
        label: null,
        sections: [
            { id: 'general', icon: Monitor, label: 'General', description: 'This project on this machine.', pane: GeneralPane },
            { id: 'appearance', icon: Palette, label: 'Appearance', description: 'Theme and density.', pane: EmptyPane },
            { id: 'notifications', icon: Bell, label: 'Notifications', description: 'What asks for you.', pane: EmptyPane }
        ]
    },
    {
        label: 'Advanced',
        sections: [{ id: 'shortcuts', icon: Keyboard, label: 'Shortcuts', description: 'Every key the app knows.', pane: EmptyPane as ComponentType }]
    }
];

const SETTINGS_FOOTER = [{ id: 'about', icon: Info, label: 'About', description: 'The version you run.', pane: EmptyPane }];

function OpenSettings() {
    const { slot, popup } = usePinned();
    const [section, setSection] = useState('general');
    const [open, setOpen] = useState(false);
    if (!HELD) {
        return (
            <>
                <Button variant="secondary" onClick={() => setOpen(true)}>
                    Open settings
                </Button>
                <SettingsDialog
                    open={open}
                    onOpenChange={setOpen}
                    section={section}
                    onNavigate={(next) => setSection(next.section)}
                    groups={SETTINGS_GROUPS}
                    footer={SETTINGS_FOOTER}
                    search={{ find: () => [], hint: '⌘F' }}
                />
            </>
        );
    }
    return (
        <div ref={slot} className="h-[800px] w-full">
            <SettingsDialog
                ref={popup}
                className="showcase-pinned"
                open
                onOpenChange={ignore}
                section={section}
                onNavigate={(next) => setSection(next.section)}
                groups={SETTINGS_GROUPS}
                footer={SETTINGS_FOOTER}
                search={{ find: () => [], hint: '⌘F' }}
            />
        </div>
    );
}

const PROVIDER_ROWS: { provider: UsageProvider; name: string; status: string; signedIn: boolean }[] = [
    { provider: 'claude', name: 'Claude', status: 'Signed in as work', signedIn: true },
    { provider: 'codex', name: 'Codex', status: 'Signed in', signedIn: true },
    { provider: 'grok', name: 'Grok', status: 'Not signed in', signedIn: false },
    { provider: 'copilot', name: 'Copilot', status: 'Not installed', signedIn: false }
];

const RECENT = [
    { name: 'adecore', path: '~/Development/Projects/adecore' },
    { name: 'website', path: '~/Development/Projects/website' },
    { name: 'notes', path: '~/Documents/notes' }
];

function StartScreen() {
    return (
        <div className="flex w-full gap-8 p-6">
            <div className="flex w-[560px] shrink-0 flex-col gap-6">
                <div className="grid grid-cols-2 gap-2">
                    <Tile primary icon={<Icon icon={Plus} />} title="New project" description="Start from an empty folder" shortcut={shortcut('Mod+N')} />
                    <Tile icon={<Icon icon={FolderOpen} />} title="Open a folder" description="Anything on this computer" shortcut={shortcut('Mod+O')} />
                    <Tile icon={<Icon icon={GitPullRequestArrow} />} title="Clone" size="sm" />
                    <Tile icon={<Icon icon={SquareTerminal} />} title="New chat" size="sm" />
                </div>
                <div className="flex flex-col gap-1">
                    <SectionLabel className="px-2">Recent</SectionLabel>
                    {RECENT.map((project) => (
                        <ListRow
                            key={project.name}
                            variant="inset"
                            className="gap-2 text-sm text-text hover:bg-surface-hover"
                            render={<button type="button" />}
                        >
                            <Icon icon={FolderGit2} size={14} className="text-text-faint" />
                            {project.name}
                            <span className="truncate text-xs text-text-faint">{project.path}</span>
                        </ListRow>
                    ))}
                </div>
            </div>
            <div className="flex min-w-0 grow flex-col gap-1">
                <SectionLabel className="px-2">Agents</SectionLabel>
                <div className="flex flex-col divide-y divide-border-soft rounded-lg border border-border bg-surface">
                    {PROVIDER_ROWS.map((row) => (
                        <div key={row.provider} className="flex items-center gap-3 px-3 py-2.5">
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-raised">
                                <ProviderLogo provider={row.provider} size={16} />
                            </span>
                            <span className="flex min-w-0 grow flex-col">
                                <span className="text-sm font-medium text-text">{row.name}</span>
                                <span className="text-xs text-text-muted">{row.status}</span>
                            </span>
                            {row.signedIn ? (
                                <Pill tone="idle">Ready</Pill>
                            ) : (
                                <Button size="sm" variant="secondary">
                                    <Icon icon={UserRound} size={14} /> Sign in
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <ButtonGroup>
                        <Tooltip label="Refresh">
                            <IconButton icon={RefreshCw} label="Refresh" size="sm" tooltip={false} />
                        </Tooltip>
                    </ButtonGroup>
                    <span className="text-xs text-text-faint">Checked a minute ago</span>
                </div>
            </div>
        </div>
    );
}

export function CompositionSection() {
    return (
        <Section id="compositions" title="Compositions" description="The components together, the way an app builds its panels, panes and screens from them">
            <Specimen name="Side panel" caption="PanelHeader, Pill, SplitButton, Menu, FileTree, TextArea, Checkbox, ListRow" span={3} className="gap-6">
                <GitPanel />
                <div className="h-[720px] w-[460px] shrink-0">
                    <ChatDemo />
                </div>
                <div className="flex min-w-0 grow basis-0 flex-col gap-2 text-xs text-text-muted">
                    <p>The source control panel and a chat column side by side, as a workspace puts them.</p>
                    <p>
                        The file tree has checkboxes, decorations, a git status, a row icon for package.json, the match on "button" lit and an empty folder
                        line.
                    </p>
                </div>
            </Specimen>
            <Specimen name="SettingsDialog" caption="a pane of rows: Input, Select, Switch, Stepper, Segmented" span={3} plain>
                <OpenSettings />
            </Specimen>
            <Specimen name="Start screen" caption="Tile, ListRow, provider rows" span={3} plain>
                <StartScreen />
            </Specimen>
        </Section>
    );
}
