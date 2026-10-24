import { useState } from 'react';
import { ArrowUp, Bold, Check, Copy, Download, FolderOpen, GitBranch, Italic, Plus, RefreshCw, Search, Settings2, Trash, Underline, X } from 'lucide-react';
import {
    Banner,
    Button,
    ButtonGroup,
    Checkbox,
    CopyButton,
    EmptyState,
    Field,
    Icon,
    IconButton,
    Input,
    Kbd,
    KeyCap,
    Keys,
    Meter,
    PanelEmpty,
    Pill,
    Segmented,
    Select,
    Skeleton,
    Slider,
    Spinner,
    Stepper,
    Switch,
    TextArea,
    shortcut
} from '@adecore/ui';
import { Section, Specimen } from '../layout.tsx';

const VARIANTS = ['primary', 'secondary', 'ghost', 'danger', 'danger-outline', 'positive', 'inverse'] as const;
const SIZES = ['xs', 'sm', 'md'] as const;
const ICON_SIZES = ['2xs', 'xs', 'sm', 'md'] as const;

const BRANCHES = [
    { value: 'main', label: 'main' },
    { value: 'feature/export', label: 'feature/export' },
    { value: 'fix/tooltip-flicker', label: 'fix/tooltip-flicker', description: 'Two commits ahead' }
];

function ButtonMatrix() {
    return (
        <div className="grid w-full grid-cols-[120px_repeat(5,auto)] items-center gap-x-4 gap-y-3">
            <span />
            {SIZES.map((size) => (
                <span key={size} className="text-xs text-text-faint">
                    {size}
                </span>
            ))}
            <span className="text-xs text-text-faint">with icon</span>
            <span className="text-xs text-text-faint">disabled</span>
            {VARIANTS.map((variant) => (
                <div key={variant} className="contents">
                    <span className="font-mono text-xs text-text-muted">{variant}</span>
                    {SIZES.map((size) => (
                        <span key={size}>
                            <Button variant={variant} size={size}>
                                Commit
                            </Button>
                        </span>
                    ))}
                    <span>
                        <Button variant={variant} size="sm">
                            <Icon icon={ArrowUp} size={14} /> Push
                        </Button>
                    </span>
                    <span>
                        <Button variant={variant} size="sm" disabled>
                            Push
                        </Button>
                    </span>
                </div>
            ))}
        </div>
    );
}

function IconButtons() {
    return (
        <div className="flex flex-col gap-3">
            {ICON_SIZES.map((size) => (
                <div key={size} className="flex items-center gap-2">
                    <span className="w-10 font-mono text-xs text-text-muted">{size}</span>
                    <IconButton icon={Plus} label="Add" size={size} />
                    <IconButton icon={Settings2} label="Settings" size={size} active />
                    <IconButton icon={RefreshCw} label="Refresh" size={size} busy />
                    <IconButton icon={Trash} label="Delete" size={size} disabled />
                </div>
            ))}
            <div className="flex items-center gap-2">
                <span className="w-10 font-mono text-xs text-text-muted">group</span>
                <ButtonGroup>
                    <IconButton icon={Bold} label="Bold" size="sm" active />
                    <IconButton icon={Italic} label="Italic" size="sm" />
                    <IconButton icon={Underline} label="Underline" size="sm" />
                </ButtonGroup>
                <ButtonGroup>
                    <Button size="sm" variant="secondary">
                        Fetch
                    </Button>
                    <Button size="sm" variant="secondary">
                        Pull
                    </Button>
                </ButtonGroup>
                <CopyButton text="a1c9e2f" label="Copy the hash" />
            </div>
        </div>
    );
}

function Fields() {
    const [branch, setBranch] = useState('feature/export');
    const [search, setSearch] = useState('main');
    return (
        <div className="grid w-full grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Input, md">
                <Input placeholder="Name of the branch" />
            </Field>
            <Field label="Input, sm, mono, filled">
                <Input size="sm" mono defaultValue="feature/export" />
            </Field>
            <Field label="Input with icon and end">
                <Input icon={Search} size="sm" placeholder="Filter files" defaultValue="button" end={<IconButton icon={X} label="Clear" size="2xs" />} />
            </Field>
            <Field label="Input, disabled" hint="A hint under the field.">
                <Input disabled defaultValue="Read only" />
            </Field>
            <Field label="Input, invalid" error="The remote refused the push.">
                <Input aria-invalid defaultValue="HEAD" />
            </Field>
            <Field label="TextArea, field">
                <TextArea rows={3} placeholder="What does this change?" />
            </Field>
            <Field label="Select, md and sm">
                <div className="flex items-center gap-2">
                    <Select label="Branch" value={branch} items={BRANCHES} onValueChange={setBranch} />
                    <Select label="Branch" size="sm" value={branch} items={BRANCHES} onValueChange={setBranch} />
                </div>
            </Field>
            <Field label="Select, ghost and placeholder">
                <div className="flex items-center gap-2">
                    <Select label="Branch" variant="ghost" size="sm" value={branch} items={BRANCHES} onValueChange={setBranch} />
                    <Select label="Branch" value={null} placeholder="Pick a branch" items={BRANCHES} onValueChange={setBranch} />
                </div>
            </Field>
            <Field label="Select, searchable">
                <Select searchable label="Branch" value={search} items={BRANCHES} onValueChange={setSearch} />
            </Field>
            <Field label="Select, disabled">
                <Select label="Branch" disabled value={branch} items={BRANCHES} onValueChange={setBranch} />
            </Field>
        </div>
    );
}

const ignore = (): void => {};

const CHECKBOXES = [
    { label: 'Checked', checked: true },
    { label: 'Unchecked', checked: false },
    { label: 'Mixed', checked: false, indeterminate: true },
    { label: 'Disabled', checked: true, disabled: true }
];

function Toggles() {
    const [on, setOn] = useState(true);
    const [size, setSize] = useState(14);
    const [opacity, setOpacity] = useState(60);
    const [view, setView] = useState('tree');
    return (
        <div className="flex w-full flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                {CHECKBOXES.map((box) => (
                    <span key={box.label} className="flex items-center gap-1.5">
                        <Checkbox label={box.label} checked={box.checked} indeterminate={box.indeterminate} disabled={box.disabled} onCheckedChange={ignore} />
                        {box.label}
                    </span>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                    <Switch label="On" checked={on} onCheckedChange={setOn} /> On
                </span>
                <span className="flex items-center gap-1.5">
                    <Switch label="Off" checked={false} onCheckedChange={ignore} /> Off
                </span>
                <span className="flex items-center gap-1.5">
                    <Switch label="Disabled" checked disabled onCheckedChange={ignore} /> Disabled
                </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Segmented
                    label="View"
                    value={view}
                    onValueChange={setView}
                    options={[
                        { id: 'list', label: 'List' },
                        { id: 'tree', label: 'Tree' }
                    ]}
                />
                <Segmented
                    label="View"
                    size="sm"
                    value={view}
                    onValueChange={setView}
                    options={[
                        { id: 'list', label: 'List' },
                        { id: 'tree', label: 'Tree' }
                    ]}
                />
                <Stepper label="Font size" value={size} onValueChange={setSize} min={10} max={24} step={1} unit="px" />
            </div>
            <Slider label="Opacity" value={opacity} onValueChange={setOpacity} min={0} max={100} unit="%" />
        </div>
    );
}

function Labels() {
    return (
        <div className="flex w-full flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <Pill>12 files</Pill>
                <Pill tone="raised">Draft</Pill>
                <Pill tone="idle">Idle</Pill>
                <Pill tone="needsYou">Needs you</Pill>
                <Pill tone="error">Failed</Pill>
                <Pill tone="accent">New</Pill>
                <Pill shape="tag" mono>
                    <Icon icon={GitBranch} size={12} /> main
                </Pill>
                <Pill size="sm">sm</Pill>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <Kbd shortcut={shortcut('Mod+K')} />
                <Kbd shortcut={shortcut('Mod+Shift+P')} variant="inline" />
                <Keys shortcut={shortcut('Mod+Enter')} />
                <KeyCap>Esc</KeyCap>
                <Spinner size={16} />
                <Spinner size={12} />
            </div>
            <Meter label="Context" value={62} valueText="62%" marks={[50, 80]} />
            <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

function Messages() {
    return (
        <div className="flex w-full flex-col gap-3">
            <Banner icon={Download} tone="attention" message="An update is ready to install." placement="inline">
                <Button size="xs" variant="secondary">
                    Restart
                </Button>
            </Banner>
            <Banner icon={X} tone="error" message="The remote did not answer within 30 seconds." placement="inline" />
            <Banner icon={Check} tone="neutral" message="Everything is pushed." placement="inline" />
            <div className="grid grid-cols-2 gap-3">
                <div className="h-40 rounded-lg border border-border">
                    <PanelEmpty icon={FolderOpen} action={<Button size="sm">Open a folder</Button>}>
                        No folder is open.
                    </PanelEmpty>
                </div>
                <div className="h-40 rounded-lg border border-border">
                    <PanelEmpty sunken busy>
                        Loading the history
                    </PanelEmpty>
                </div>
            </div>
            <EmptyState icon={Copy} title="Nothing to compare" action={<Button variant="secondary">Pick a commit</Button>}>
                Pick two commits to see what changed between them.
            </EmptyState>
        </div>
    );
}

export function MatrixSection() {
    return (
        <Section id="matrix" title="Buttons, fields and states" description="Every variant and size side by side, in rest, active, busy and disabled">
            <Specimen name="Button" caption="variant x size" span={2}>
                <ButtonMatrix />
            </Specimen>
            <Specimen name="IconButton, ButtonGroup, CopyButton" caption="size x state">
                <IconButtons />
            </Specimen>
            <Specimen name="Field, Input, TextArea, Select" span={2}>
                <Fields />
            </Specimen>
            <Specimen name="Checkbox, Switch, Segmented, Stepper, Slider">
                <Toggles />
            </Specimen>
            <Specimen name="Pill, Kbd, Keys, KeyCap, Spinner, Meter, Skeleton">
                <Labels />
            </Specimen>
            <Specimen name="Banner, PanelEmpty, EmptyState" span={2}>
                <Messages />
            </Specimen>
        </Section>
    );
}
