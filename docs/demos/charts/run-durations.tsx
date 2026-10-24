import { Chart } from '@adecore/charts';
import { formatClock, formatDuration, formatNumber } from '@adecore/ui/format';

const START = Date.UTC(2026, 9, 24, 6);
const STATUSES = { ok: 'Succeeded', error: 'Failed', missed: 'Missed' } as const;

/* The latest runs of a job, oldest first: how long each took, and how it ended. A missed run took no time at all. */
const runs = [42, 38, 51, 47, null, 44, 39, 112, 46, 41, 43, 40, 95, 45, 38, 44].map((seconds, index) => ({
    id: `run-${index}`,
    at: START + index * 15 * 60_000,
    duration: seconds === null ? null : seconds * 1000,
    status: seconds === null ? ('missed' as const) : seconds > 90 ? ('error' as const) : ('ok' as const)
}));

export default function RunDurationsDemo() {
    return (
        <Chart.Root
            data={runs}
            x="id"
            label="Duration of the latest runs"
            height={160}
            format={formatDuration}
            rowLabel={(run) => `${formatClock(run.at)}, ${STATUSES[run.status]}`}
            cursor="none"
            className="w-full"
        >
            <Chart.Grid />
            <Chart.YAxis ticks={3} format={(ms) => `${formatNumber(ms / 1000)} s`} />
            <Chart.Bar
                value={(run) => run.duration ?? 0}
                label="Duration"
                tone={(run) => (run.status === 'error' ? 'error' : run.status === 'missed' ? 'muted' : { color: 'var(--chart-3)' })}
                columnWidth={(bucket) => Math.max(2, Math.min(16, bucket - 2))}
                radius={0}
                minHeight={3}
            />
            <Chart.Tooltip placement="top-right" />
        </Chart.Root>
    );
}
