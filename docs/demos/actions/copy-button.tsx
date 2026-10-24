import { CopyButton } from '@adecore/ui';

const DSN = 'https://4f1c9e@ingest.example.com/12';
const COMMAND = 'npm install -g @example/cli';

export default function CopyButtonDemo() {
    return (
        <div className="flex w-full max-w-96 flex-col gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-1">
                <code className="truncate font-mono text-code text-text">{DSN}</code>
                <CopyButton text={DSN} label="Copy DSN" size="xs" />
            </div>
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface-sunken py-1 pr-1 pl-3">
                <code className="min-w-0 grow truncate font-mono text-code text-text">{COMMAND}</code>
                <CopyButton text={COMMAND} showLabel size="xs" variant="secondary" />
            </div>
        </div>
    );
}
