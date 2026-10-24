import { Chart } from '@adecore/charts';
import { TRANSACTION_DEPLOYS, transactionPerHalfHour } from '../shared/chart-data.ts';

const buckets = transactionPerHalfHour();
const HALF_HOUR = 30 * 60_000;

export default function TransactionRunsDemo() {
    return (
        <Chart.Root
            data={buckets}
            x="at"
            xScale="time"
            step={HALF_HOUR}
            y={{ integer: true }}
            label="Runs and failures over time"
            height={200}
            className="w-full"
        >
            <Chart.Grid />
            <Chart.XAxis />
            <Chart.YAxis />
            <Chart.Bars stack>
                <Chart.Bar value="succeeded" label="Succeeded" />
                <Chart.Bar value="failed" label="Failed" tone="error" />
            </Chart.Bars>
            {TRANSACTION_DEPLOYS.map((deploy) => (
                <Chart.Marker key={deploy.version} at={deploy.at} label={`Deploy ${deploy.version}`} tone="accent" />
            ))}
            <Chart.Tooltip total="Runs" />
            <Chart.Legend />
        </Chart.Root>
    );
}
