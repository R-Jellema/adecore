import { Chart } from '@adecore/charts';
import { DEPLOY, GAP, runsPerHour } from '../shared/chart-data.ts';

const runs = runsPerHour();
const HOUR = 3_600_000;

export default function ColumnsOverTimeDemo() {
    return (
        <Chart.Root data={runs} x="at" xScale="time" step={HOUR} y={{ integer: true }} label="Runs and failures per hour" height={220} className="w-full">
            <Chart.Grid />
            <Chart.Band from={GAP.start} to={GAP.end} label="No data from the collector" />
            <Chart.XAxis />
            <Chart.YAxis />
            <Chart.Bars stack>
                <Chart.Bar value="succeeded" label="Succeeded" />
                <Chart.Bar value="failed" label="Failed" tone="error" />
            </Chart.Bars>
            <Chart.Marker at={DEPLOY.at} label={`Deploy ${DEPLOY.version}`} tone="accent" />
            <Chart.Tooltip total="Runs" />
            <Chart.Legend />
        </Chart.Root>
    );
}
