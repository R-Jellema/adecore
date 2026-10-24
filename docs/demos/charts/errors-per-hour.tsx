import { Chart } from '@adecore/charts';
import { DEPLOY, GAP, errorsPerHour } from '../shared/chart-data.ts';

const buckets = errorsPerHour();

export default function ErrorsPerHourDemo() {
    return (
        <Chart.Root data={buckets} x="at" xScale="time" y={{ integer: true }} label="Events per hour" height={220} className="w-full">
            <Chart.Grid />
            <Chart.Band from={GAP.start} to={GAP.end} label="No data from the collector" />
            <Chart.XAxis />
            <Chart.YAxis />
            <Chart.Area value="errors" label="Errors" tone="error" />
            <Chart.Line value="warnings" label="Warnings" tone="needsYou" />
            <Chart.Marker at={DEPLOY.at} label={`Deploy ${DEPLOY.version}`} tone="accent" />
            <Chart.Tooltip />
            <Chart.Legend />
            <Chart.Table />
        </Chart.Root>
    );
}
