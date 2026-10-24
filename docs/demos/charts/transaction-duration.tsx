import { Chart } from '@adecore/charts';
import { formatPreciseDuration } from '@adecore/ui/format';
import { TRANSACTION_DEPLOYS, transactionPerHalfHour } from '../shared/chart-data.ts';

const buckets = transactionPerHalfHour();
const HALF_HOUR = 30 * 60_000;

export default function TransactionDurationDemo() {
    return (
        <Chart.Root data={buckets} x="at" xScale="time" step={HALF_HOUR} label="p50 and p95 duration over time" height={200} className="w-full">
            <Chart.Grid />
            <Chart.XAxis />
            <Chart.YAxis format={formatPreciseDuration} />
            <Chart.Line value="p50" label="p50" tone={{ color: 'var(--chart-3)' }} />
            <Chart.Line value="p95" label="p95" tone={{ color: 'var(--chart-1)' }} />
            {TRANSACTION_DEPLOYS.map((deploy) => (
                <Chart.Marker key={deploy.version} at={deploy.at} label={`Deploy ${deploy.version}`} tone="accent" />
            ))}
            <Chart.Tooltip />
            <Chart.Legend />
        </Chart.Root>
    );
}
