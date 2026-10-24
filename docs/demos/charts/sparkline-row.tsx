import { Sparkline } from '@adecore/charts';
import { formatNumber, formatTokens } from '@adecore/ui/format';
import { eventsPerService, tokensPerDay } from '../shared/chart-data.ts';

const services = eventsPerService();
const tokens = tokensPerDay().map((day) => day.input + day.output);

export default function SparklineRowDemo() {
    return (
        <div className="flex w-full max-w-md flex-col gap-6">
            <ul className="flex flex-col divide-y divide-border-soft">
                {services.map((service) => (
                    <li key={service.name} className="flex h-10 items-center gap-3 text-sm">
                        <span className="w-24 font-mono text-text">{service.name}</span>
                        <Sparkline values={service.perDay} kind="bars" label={`Events of ${service.name} in 14 days`} width={82} height={16} />
                        <span className="ml-auto text-text-muted tabular-nums">{formatNumber(service.perDay.reduce((sum, count) => sum + count, 0))}</span>
                    </li>
                ))}
            </ul>
            <div className="flex items-center gap-3 text-sm">
                <span className="w-24 text-text-muted">Tokens</span>
                <Sparkline values={tokens} label="Tokens in 14 days" tone="running" format={formatTokens} width={160} />
            </div>
        </div>
    );
}
