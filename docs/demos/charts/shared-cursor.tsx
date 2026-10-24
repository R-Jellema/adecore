import { Chart } from '@adecore/charts';
import { DEPLOY, errorsPerHour, latency } from '../shared/chart-data.ts';

const errors = errorsPerHour();
const p95 = latency();

export default function SharedCursorDemo() {
    return (
        <Chart.Group className="flex w-full flex-col gap-6">
            <Chart.Root data={errors} x="at" xScale="time" y={{ integer: true }} label="Errors per hour" height={150}>
                <Chart.Grid />
                <Chart.YAxis />
                <Chart.Area value="errors" label="Errors" tone="error" />
                <Chart.Marker at={DEPLOY.at} label={`Deploy ${DEPLOY.version}`} tone="accent" />
                <Chart.Tooltip />
            </Chart.Root>
            <Chart.Root data={p95} x="at" xScale="time" label="Latency, p95" height={170}>
                <Chart.Grid />
                <Chart.XAxis />
                <Chart.YAxis format={(value) => `${value} ms`} />
                <Chart.Line value="p95" label="p95" curve="monotone" />
                <Chart.Marker at={DEPLOY.at} label={`Deploy ${DEPLOY.version}`} tone="accent" />
                <Chart.Tooltip format={(value) => `${value} ms`} />
            </Chart.Root>
        </Chart.Group>
    );
}
