import type { ComponentType } from 'react';
import { ErrorBoundary } from '@adecore/ui';
import { Section, Specimen } from '../layout.tsx';

type DemoModule = { default: ComponentType };

// The docs' demos as they are, so every component shows the way its page shows it, with the same data.
const DEMOS = import.meta.glob<DemoModule>(
    [
        '../../../../docs/demos/actions/*.tsx',
        '../../../../docs/demos/inputs/*.tsx',
        '../../../../docs/demos/display/*.tsx',
        '../../../../docs/demos/overlays/*.tsx',
        '../../../../docs/demos/settings/*.tsx',
        '../../../../docs/demos/layout/*.tsx',
        '../../../../docs/demos/formatting/*.tsx',
        '../../../../docs/demos/utilities/*.tsx',
        '../../../../docs/demos/hooks/*.tsx',
        '../../../../docs/demos/agents/*.tsx'
    ],
    { eager: true }
);

/* The demos that need more room than a third of the page, by their path under `docs/demos`. */
const SPAN: Record<string, 2 | 3> = {
    'actions/button-variants': 2,
    'actions/tile': 2,
    'inputs/choice-cards': 2,
    'inputs/choice-cards-columns': 2,
    'inputs/color-wheel-picker': 2,
    'inputs/icon-picker-groups': 2,
    'display/banner': 2,
    'display/list-row': 2,
    'display/key-value-list-rich': 2,
    'display/tree': 2,
    'settings/master-detail': 3,
    'settings/settings-section': 2,
    'layout/dock-shell': 3,
    'layout/workspace': 3,
    'layout/split-view': 3,
    'layout/sliding-column': 3,
    'layout/wipe': 2,
    'layout/tab-strip': 3,
    'layout/tabs': 2,
    'layout/tabs-closable': 2,
    'layout/tabs-icons': 2,
    'layout/tabs-overflow': 2,
    'layout/tabs-pinned': 2,
    'layout/drop-preview': 2,
    'layout/column-resize-handle': 2,
    'formatting/dates': 2,
    'formatting/numbers': 2,
    'formatting/durations': 2,
    'formatting/regions': 2,
    'formatting/source': 2,
    'hooks/use-column-resize': 2,
    'agents/chat': 3,
    'agents/rows': 2,
    'agents/chat-parts': 2,
    'agents/composer': 2,
    'agents/composer-input': 2,
    'agents/prompts': 3,
    'agents/providers-pane': 3,
    'agents/usage-page': 3,
    'agents/usage-pane': 2,
    'agents/usage-parts': 3,
    'agents/usage-limits': 2,
    'agents/limits': 2,
    'agents/subagents': 2,
    'agents/diffs': 3,
    'agents/markdown': 2,
    'agents/code-block': 2,
    'agents/ansi-output': 2,
    'agents/generated-image': 2,
    'agents/intelligent-ui': 3
};

const GROUPS: { folder: string; title: string; description: string }[] = [
    { folder: 'actions', title: 'Actions', description: 'Button, SplitButton, IconButton, ButtonGroup, CloseButton, CopyButton, Pill, Tile' },
    {
        folder: 'inputs',
        title: 'Inputs',
        description: 'Input, TextArea, Field, Select, SelectSearch, Combobox, Checkbox, Switch, Segmented, Stepper, Slider, ChoiceCards, pickers'
    },
    {
        folder: 'display',
        title: 'Display',
        description: 'Banner, EmptyState, PanelEmpty, PanelHeader, ListRow, FileTree, Tree, Meter, Skeleton, Spinner, Kbd, Surface, ...'
    },
    { folder: 'overlays', title: 'Overlays, closed', description: 'The triggers as a page shows them; the next section holds them open' },
    { folder: 'settings', title: 'Settings', description: '@adecore/ui/settings' },
    { folder: 'layout', title: 'Layout', description: 'Tabs, TabStrip, Workspace, SplitView, DockShell, SlidingColumn, Wipe, ZoomControls' },
    { folder: 'formatting', title: 'Formatting', description: '@adecore/ui/format' },
    { folder: 'utilities', title: 'Utilities', description: 'Clipboard, floating layers, lazy loading, shortcuts' },
    { folder: 'hooks', title: 'Hooks', description: 'useAsyncAction, useColumnResize, useContentSize, useNow' },
    { folder: 'agents', title: 'Agents', description: '@adecore/agents-react: thread rows, composer, pickers, prompts, providers, usage' }
];

function pascalCase(name: string): string {
    return name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

function demosOf(folder: string): { path: string; Demo: ComponentType }[] {
    const prefix = `../../../../docs/demos/${folder}/`;
    return Object.entries(DEMOS)
        .filter(([file]) => file.startsWith(prefix))
        .map(([file, module]) => ({ path: `${folder}/${file.slice(prefix.length, -'.tsx'.length)}`, Demo: module.default }))
        .sort((left, right) => left.path.localeCompare(right.path));
}

export function DemoSections({ folders }: { folders: readonly string[] }) {
    return GROUPS.filter((group) => folders.includes(group.folder)).map((group) => (
        <Section key={group.folder} id={group.folder} title={group.title} description={group.description}>
            {demosOf(group.folder).map(({ path, Demo }) => (
                <Specimen key={path} name={pascalCase(path.slice(group.folder.length + 1))} caption={path} span={SPAN[path] ?? 1}>
                    <ErrorBoundary label={`The demo ${path} failed to render`} className="relative w-full">
                        <Demo />
                    </ErrorBoundary>
                </Specimen>
            ))}
        </Section>
    ));
}
