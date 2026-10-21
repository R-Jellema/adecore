import { ProvidersPane } from '@adecore/agents-react/providers';
import { AgentDemo } from '../shared/agents.tsx';
import { MISSING_PROVIDER, PROVIDERS } from '../shared/agents-data.ts';

export default function ProvidersPaneDemo() {
    return (
        <AgentDemo providers={[...PROVIDERS, MISSING_PROVIDER]}>
            <div className="flex h-[640px] w-full overflow-hidden rounded-lg border border-border bg-surface">
                <ProvidersPane />
            </div>
        </AgentDemo>
    );
}
