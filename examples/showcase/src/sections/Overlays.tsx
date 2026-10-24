import { useState, type ReactNode } from 'react';
import {
    ClipboardPaste,
    Copy,
    Ellipsis,
    FileText,
    Folder,
    FolderInput,
    FolderOpen,
    GitBranch,
    Info,
    NotebookPen,
    Pencil,
    Play,
    Search,
    Settings,
    Settings2,
    Square,
    Terminal,
    Trash
} from 'lucide-react';
import type { AgentKind, ModelSelection } from '@adecore/agent-contracts';
import { ModelPicker } from '@adecore/agents-react/chat/ui';
import {
    Button,
    ColorSwatch,
    Combobox,
    CommandPalette,
    Dialog,
    EDIT_SHORTCUTS,
    Field,
    Icon,
    IconButton,
    Input,
    KEY_SHORTCUTS,
    Kbd,
    Menu,
    Popover,
    PreviewCard,
    ProjectSwitcher,
    PromptDialog,
    Toasts,
    Tooltip,
    createToastStore,
    shortcut,
    type ProjectSwitcherItem
} from '@adecore/ui';
import { PROVIDERS } from '../../../../docs/demos/shared/agents-data.ts';
import '../../../../docs/demos/shared/agents-host.ts';
import { Section, Specimen } from '../layout.tsx';
import { usePinned } from '../pinned.ts';

const ignore = (): void => {};

/* Room under a trigger for the popup it holds open, so the popup covers no other specimen. */
function Stage({ height, children }: { height: number; children: ReactNode }) {
    return (
        <div className="flex w-full items-start gap-3" style={{ minHeight: height }}>
            {children}
        </div>
    );
}

function OpenMenu() {
    return (
        <Stage height={330}>
            <Menu.Root open modal={false} onOpenChange={ignore}>
                <IconButton icon={Ellipsis} label="More" render={<Menu.Trigger />} />
                <Menu.Popup>
                    <Menu.Item>
                        <Icon icon={Pencil} size={14} /> Rename <Kbd shortcut={KEY_SHORTCUTS.rename} />
                    </Menu.Item>
                    <Menu.Item>
                        <Icon icon={Copy} size={14} /> Copy path <Kbd shortcut={EDIT_SHORTCUTS.copy} />
                    </Menu.Item>
                    <Menu.SubmenuRoot>
                        <Menu.SubmenuTrigger>
                            <Icon icon={FolderInput} size={14} /> Move to
                        </Menu.SubmenuTrigger>
                        <Menu.Popup>
                            <Menu.Item>Documents</Menu.Item>
                        </Menu.Popup>
                    </Menu.SubmenuRoot>
                    <Menu.Separator />
                    <Menu.CheckboxItem checked onCheckedChange={ignore}>
                        Wrap lines
                    </Menu.CheckboxItem>
                    <Menu.Group>
                        <Menu.GroupLabel>Sort by</Menu.GroupLabel>
                        <Menu.RadioGroup value="name" onValueChange={ignore}>
                            <Menu.RadioItem value="name">Name</Menu.RadioItem>
                            <Menu.RadioItem value="modified">Last modified</Menu.RadioItem>
                        </Menu.RadioGroup>
                    </Menu.Group>
                    <Menu.Separator />
                    <Menu.Item disabled>
                        <Icon icon={ClipboardPaste} size={14} /> Paste <Menu.Hint>Nothing copied</Menu.Hint>
                    </Menu.Item>
                    <Menu.Item>
                        <Icon icon={Trash} size={14} /> Delete
                    </Menu.Item>
                </Menu.Popup>
            </Menu.Root>
        </Stage>
    );
}

function OpenMenuRows() {
    return (
        <Stage height={250}>
            <Menu.Root open modal={false} onOpenChange={ignore}>
                <Menu.Trigger render={<Button variant="secondary" />}>
                    <Icon icon={Terminal} size={14} /> Launches
                </Menu.Trigger>
                <Menu.Popup className="min-w-64">
                    {['Dev server', 'Tests', 'Docs'].map((task, index) => (
                        <Menu.Row key={task} aria-label={task}>
                            <Menu.Item>{task}</Menu.Item>
                            <Menu.RowAction
                                icon={index === 0 ? Square : Play}
                                label={index === 0 ? `Stop ${task}` : `Start ${task}`}
                                iconClassName="fill-current"
                            />
                        </Menu.Row>
                    ))}
                    <Menu.Separator />
                    <Menu.Label>Color</Menu.Label>
                    <div className="flex gap-2 px-2.5 py-1.5">
                        {['#2563eb', '#7c3aed', '#e11d48', '#16a34a'].map((swatch, index) => (
                            <ColorSwatch
                                key={swatch}
                                render={<Menu.Item unstyled closeOnClick={false} />}
                                aria-label={swatch}
                                color={swatch}
                                picked={index === 0}
                                on="popup"
                            />
                        ))}
                    </div>
                </Menu.Popup>
            </Menu.Root>
        </Stage>
    );
}

function OpenPopover() {
    return (
        <Stage height={300}>
            <Popover.Root open onOpenChange={ignore}>
                <Popover.Trigger render={<Button variant="secondary" />}>Assign</Popover.Trigger>
                <Popover.Popup variant="picker">
                    <div className="border-b border-border p-1">
                        <Input size="sm" aria-label="Find a person" placeholder="Find a person" className="border-transparent" />
                    </div>
                    <ul className="max-h-60 overflow-auto p-1">
                        {['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson'].map((person) => (
                            <li key={person} className="rounded-md px-2.5 py-1.5 text-sm text-text hover:bg-surface-hover">
                                {person}
                            </li>
                        ))}
                    </ul>
                </Popover.Popup>
            </Popover.Root>
        </Stage>
    );
}

function OpenNotice() {
    return (
        <Stage height={160}>
            <Popover.Root open onOpenChange={ignore}>
                <Popover.Trigger render={<Button variant="secondary" />}>Notifications</Popover.Trigger>
                <Popover.Popup className="w-72 p-3">
                    <Popover.Title className="text-sm font-medium text-text">Notifications</Popover.Title>
                    <Popover.Description className="mt-1 text-xs text-text-muted">Nothing new since you last looked.</Popover.Description>
                    <div className="mt-3 flex justify-end">
                        <Popover.Close render={<Button size="sm" variant="secondary" />}>Close</Popover.Close>
                    </div>
                </Popover.Popup>
            </Popover.Root>
        </Stage>
    );
}

function OpenPreviewCard() {
    return (
        <Stage height={140}>
            <p className="text-sm text-text-muted">
                The fix landed in{' '}
                <PreviewCard.Root open onOpenChange={ignore}>
                    <PreviewCard.Trigger href="#128" className="font-medium text-accent underline">
                        #128
                    </PreviewCard.Trigger>
                    <PreviewCard.Popup className="w-72 p-3">
                        <p className="text-sm font-medium text-text">Keep a nested dialog above its parent</p>
                        <p className="mt-1 text-xs text-text-muted">Merged two days ago, 3 files changed.</p>
                    </PreviewCard.Popup>
                </PreviewCard.Root>{' '}
                after a week of review.
            </p>
        </Stage>
    );
}

function OpenTooltips() {
    return (
        <Stage height={90}>
            <div className="flex w-full items-center justify-around pt-10">
                <Tooltip open label="Search everything" kbd={shortcut('Mod+K')}>
                    <Button variant="secondary">
                        <Icon icon={Search} size={14} /> Search
                    </Button>
                </Tooltip>
                <Tooltip open label="About this view" name side="bottom">
                    <IconButton icon={Info} label="About" tooltip={false} />
                </Tooltip>
            </div>
        </Stage>
    );
}

const PROJECTS: ProjectSwitcherItem[] = [
    { id: 'studio', name: 'Studio', icon: <Icon icon={Folder} size={16} />, description: '~/Projects/studio', hint: 'This Mac' },
    { id: 'website', name: 'Website', icon: <Icon icon={Folder} size={16} />, description: '~/Projects/website', hint: 'This Mac' },
    { id: 'archive', name: 'Archive', icon: <Icon icon={Folder} size={16} />, description: '/work/archive', hint: 'Laptop', muted: true }
];

function OpenProjectSwitcher() {
    return (
        <Stage height={360}>
            <ProjectSwitcher
                open
                onOpenChange={ignore}
                current={PROJECTS[0]!}
                projects={PROJECTS}
                recentProjects={[{ id: 'notes', name: 'Notes', icon: <Icon icon={Folder} size={16} />, description: '~/Projects/notes' }]}
                before={
                    <Menu.Item>
                        <Icon icon={NotebookPen} size={14} /> Scratchpad
                    </Menu.Item>
                }
                onSelect={ignore}
            >
                <Menu.Item>
                    <Icon icon={FolderOpen} size={14} /> Open folder
                </Menu.Item>
            </ProjectSwitcher>
        </Stage>
    );
}

const KEYS = ['is:unresolved', 'level:error', 'release:1.5.0', 'environment:production'];

function OpenCombobox() {
    return (
        <Stage height={200}>
            <div className="w-72">
                <Combobox.Root items={KEYS} filter={null} value="" open onOpenChange={ignore}>
                    <Combobox.Input icon={Search} size="sm" aria-label="Search issues" placeholder="Search, or filter as level:error" />
                    <Combobox.Popup>
                        <Combobox.List>
                            {(item: string) => (
                                <Combobox.Item key={item} value={item}>
                                    {item}
                                </Combobox.Item>
                            )}
                        </Combobox.List>
                    </Combobox.Popup>
                </Combobox.Root>
            </div>
        </Stage>
    );
}

function OpenModelPicker() {
    const [provider, setProvider] = useState<AgentKind>('claude');
    const [selection, setSelection] = useState<ModelSelection>({ model: 'sonnet', options: {} });
    return (
        <Stage height={420}>
            <ModelPicker
                providers={PROVIDERS}
                provider={provider}
                selection={selection}
                open
                onOpenChange={ignore}
                onChange={(next, slug) => {
                    setProvider(next);
                    setSelection({ model: slug, options: {} });
                }}
                kbd={null}
                side="bottom"
                trigger="chip"
            />
        </Stage>
    );
}

interface Command {
    id: string;
    label: string;
    icon: typeof Search;
    hint?: string;
}

const COMMAND_GROUPS: { value: string; items: Command[] }[] = [
    {
        value: 'Views',
        items: [
            { id: 'files', label: 'Files', icon: FileText },
            { id: 'git', label: 'Source control', icon: GitBranch, hint: '3 changes' }
        ]
    },
    {
        value: 'Actions',
        items: [
            { id: 'settings', label: 'Open settings', icon: Settings },
            { id: 'terminal', label: 'New terminal', icon: Terminal }
        ]
    }
];

function OpenCommandPalette() {
    const { slot, popup } = usePinned();
    return (
        <div ref={slot} className="h-[400px] w-full">
            <CommandPalette.Root
                open
                onOpenChange={ignore}
                items={COMMAND_GROUPS}
                filter={null}
                value=""
                itemToStringValue={(command: Command) => command.label}
            >
                <CommandPalette.Popup ref={popup} className="showcase-pinned">
                    <CommandPalette.Input aria-label="Jump to" placeholder="Jump to a screen, a project or an action" />
                    <CommandPalette.List>
                        {(group: { value: string; items: Command[] }) => (
                            <CommandPalette.Group key={group.value} items={group.items}>
                                <CommandPalette.GroupLabel>{group.value}</CommandPalette.GroupLabel>
                                <CommandPalette.Collection>
                                    {(command: Command) => (
                                        <CommandPalette.Item key={command.id} value={command} icon={<Icon icon={command.icon} size={14} />} hint={command.hint}>
                                            {command.label}
                                        </CommandPalette.Item>
                                    )}
                                </CommandPalette.Collection>
                            </CommandPalette.Group>
                        )}
                    </CommandPalette.List>
                    <CommandPalette.Footer>
                        <span className="flex items-center gap-1.5">
                            <Kbd variant="inline">↑</Kbd>
                            <Kbd variant="inline">↓</Kbd> Move
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Kbd shortcut={KEY_SHORTCUTS.enter} variant="inline" /> Run
                        </span>
                    </CommandPalette.Footer>
                </CommandPalette.Popup>
            </CommandPalette.Root>
        </div>
    );
}

function OpenDialog() {
    const { slot, popup } = usePinned();
    return (
        <div ref={slot} className="h-[180px] w-full">
            <Dialog.Root open onOpenChange={ignore} modal={false}>
                <Dialog.Popup ref={popup} size="sm" className="showcase-pinned">
                    <Dialog.Title>Remove the branch?</Dialog.Title>
                    <Dialog.Description className="mt-1">It has two commits nothing else has.</Dialog.Description>
                    <Dialog.Text size="xs" className="mt-2">
                        A removed branch can be restored from the reflog for 90 days.
                    </Dialog.Text>
                    <Dialog.Footer>
                        <Dialog.Close render={<Button />}>Cancel</Dialog.Close>
                        <Button variant="danger">Remove</Button>
                    </Dialog.Footer>
                </Dialog.Popup>
            </Dialog.Root>
        </div>
    );
}

function OpenPromptDialog() {
    const { slot, popup } = usePinned();
    return (
        <div ref={slot} className="h-[240px] w-full">
            <PromptDialog
                ref={popup}
                className="showcase-pinned"
                open
                onOpenChange={ignore}
                title="Rename the branch"
                titleIcon={GitBranch}
                description="Pushes under the new name the next time you push."
                field={{ label: 'New name', initial: 'feature/export', mono: true, maxLength: 60 }}
                confirmLabel="Rename"
                onConfirm={ignore}
            />
        </div>
    );
}

function OpenFormDialog() {
    const { slot, popup } = usePinned();
    const [remote, setRemote] = useState('git@github.com:owner/repo.git');
    return (
        <div ref={slot} className="h-[330px] w-full">
            <Dialog.Root open onOpenChange={ignore} modal={false}>
                <Dialog.Popup ref={popup} size="sm" className="showcase-pinned">
                    <Dialog.Title className="flex items-center gap-2">
                        <Icon icon={Settings2} size={16} className="text-text-faint" /> Add a remote
                    </Dialog.Title>
                    <Dialog.Description className="mt-1">Fetch and push to another copy of this repository.</Dialog.Description>
                    <div className="mt-4 flex flex-col gap-3">
                        <Field label="Name">
                            <Input mono defaultValue="upstream" />
                        </Field>
                        <Field label="Address" hint="An SSH or HTTPS address.">
                            <Input mono value={remote} onChange={(event) => setRemote(event.target.value)} />
                        </Field>
                    </div>
                    <Dialog.Footer>
                        <Dialog.Close render={<Button />}>Cancel</Dialog.Close>
                        <Button variant="primary">Add remote</Button>
                    </Dialog.Footer>
                </Dialog.Popup>
            </Dialog.Root>
        </div>
    );
}

const toasts = createToastStore();
let toastsShown = false;

function showToasts(): void {
    if (toastsShown) {
        return;
    }
    toastsShown = true;
    const store = toasts.getState();
    store.show({ kind: 'progress', title: 'Pushing to origin' });
    store.show({ kind: 'success', title: 'Pushed to origin', description: '3 commits', persist: true });
    store.show({
        kind: 'error',
        title: 'Could not fetch',
        description: 'The remote did not answer within 30 seconds.',
        actions: [
            { label: 'Show log', run: ignore },
            { label: 'Try again', run: ignore }
        ]
    });
    store.show({ kind: 'deleted', title: 'Moved "notes.md" to the trash', action: { label: 'Undo', run: ignore }, lifetime: 60_000 });
}

function OpenToasts() {
    showToasts();
    return <Toasts store={toasts} className="showcase-toasts" />;
}

export function OverlaySection() {
    return (
        <Section id="open-overlays" title="Overlays, open" description="Held open in place, so every popup shows at once">
            <Specimen name="Menu" caption="Item, Kbd, SubmenuTrigger, CheckboxItem, RadioItem, Hint">
                <OpenMenu />
            </Specimen>
            <Specimen name="Menu.Row, ColorSwatch" caption="RowAction, Label">
                <OpenMenuRows />
            </Specimen>
            <Specimen name="ProjectSwitcher" caption="open, with recent projects">
                <OpenProjectSwitcher />
            </Specimen>
            <Specimen name="Popover" caption="variant picker">
                <OpenPopover />
            </Specimen>
            <Specimen name="Popover, PreviewCard">
                <div className="flex w-full flex-col gap-4">
                    <OpenNotice />
                    <OpenPreviewCard />
                </div>
            </Specimen>
            <Specimen name="Combobox, Tooltip">
                <div className="flex w-full flex-col gap-4">
                    <OpenCombobox />
                    <OpenTooltips />
                </div>
            </Specimen>
            <Specimen name="ModelPicker" caption="agents-react, trigger chip">
                <OpenModelPicker />
            </Specimen>
            <Specimen name="CommandPalette" span={2}>
                <OpenCommandPalette />
            </Specimen>
            <Specimen name="Toasts" caption="progress, success, error, deleted">
                <OpenToasts />
            </Specimen>
            <Specimen name="Dialog, PromptDialog" caption="a question, one field, a form" span={3}>
                <div className="grid w-full grid-cols-3 gap-4">
                    <OpenDialog />
                    <OpenPromptDialog />
                    <OpenFormDialog />
                </div>
            </Specimen>
        </Section>
    );
}
