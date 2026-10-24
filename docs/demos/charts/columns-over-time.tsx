import { Chart } from '@adecore/charts';
import { DEPLOY, GAP, errorsPerHour } from '../shared/chart-data.ts';

const buckets = errorsPerHour();
const HOUR = 3_600_000;

export default function ColumnsOverTimeDemo() {
    return (
        <Chart.Root data={buckets} x="at" xScale="time" step={HOUR} y={{ integer: true }} label="Events per hour" height={220} className="w-full">
            <Chart.Grid />
            <Chart.Band from={GAP.start} to={GAP.end} label="No data from the collector" />
            <Chart.XAxis />
            <Chart.YAxis />
            <Chart.Bars stack>
                <Chart.Bar value="errors" label="Errors" tone="error" />
                <Chart.Bar value="warnings" label="Warnings" tone="needsYou" />
            </Chart.Bars>
            <Chart.Marker at={DEPLOY.at} label={`Deploy ${DEPLOY.version}`} tone="accent" />
            <Chart.Tooltip total />
            <Chart.Legend />
        </Chart.Root>
    );
}
