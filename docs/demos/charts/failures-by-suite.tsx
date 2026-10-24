import { Heatmap } from '@adecore/charts';
import { failuresPerSuiteAndPlatform, PLATFORMS, SUITES } from '../shared/heatmap-data.ts';

const rows = SUITES.map((suite) => ({ key: suite, label: suite }));
const columns = PLATFORMS.map((platform) => ({ key: platform, label: platform }));
const values = failuresPerSuiteAndPlatform();

export default function FailuresBySuiteDemo() {
    return (
        <div className="w-full max-w-xl">
            <Heatmap
                rows={rows}
                columns={columns}
                values={values}
                label="Failed checks per suite and platform, last 50 runs"
                valueLabel="Failed checks"
                tone="error"
                steps={4}
                cellHeight={28}
                table
            />
        </div>
    );
}
