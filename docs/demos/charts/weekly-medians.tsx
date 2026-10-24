import { Chart } from '@adecore/charts';
import { formatDay, formatDuration } from '@adecore/ui/format';

const WEEK = 7 * 24 * 60 * 60_000;
const HOUR = 60 * 60_000;
const START = Date.UTC(2026, 8, 7);

/* The median wait for a first review per week; the week nobody opened a request has no median. */
const weeks = [5.5, 3.2, 8.1, null, 2.4, 4.7, 6.3, 3.8].map((hours, index) => ({
    start: START + index * WEEK,
    median: hours === null ? null : hours * HOUR
}));

export default function WeeklyMediansDemo() {
    return (
        <Chart.Root
            data={weeks}
            x="start"
            label="Median time to a first review per week"
            height={140}
            y={{ headroom: 'none' }}
            format={formatDuration}
            rowLabel={(row) => `Week of ${formatDay(row.start)}`}
            className="w-full"
        >
            <Chart.Grid lines="ground" />
            <Chart.XAxis format={(start) => formatDay(start as number)} />
            <Chart.Bar
                value="median"
                label="Median"
                tone={{ color: 'var(--text-muted)' }}
                columnWidth={(bucket) => Math.min(40, bucket - 8)}
                radius={4}
                rounded="end"
                minHeight={2}
                valueLabels
                valueLabelSize="xs"
            />
            <Chart.Tooltip />
            <Chart.Table />
        </Chart.Root>
    );
}
