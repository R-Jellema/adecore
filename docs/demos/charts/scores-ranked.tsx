import { createChart } from '@adecore/charts';
import { LAB_COLORS, scoresByModel, type ModelScore } from '../shared/chart-data.ts';

const ScoreChart = createChart<ModelScore>();
const ranked = scoresByModel().toSorted((one, other) => other.score - one.score);
const SHORT_EFFORTS: Record<string, string> = { low: 'low', medium: 'med', high: 'high', max: 'max' };

export default function ScoresRankedDemo() {
    return (
        <ScoreChart.Root data={ranked} x="key" label="Scores, ranked" y={{ min: 0, max: 80 }} height={300} minBucketWidth={28} className="w-full">
            <ScoreChart.Grid />
            <ScoreChart.YAxis ticks={4} />
            <ScoreChart.XAxis format={(key) => SHORT_EFFORTS[String(key).split(':')[1]!]!} thin={false} />
            <ScoreChart.XAxis angle={-40} format={(key) => String(key).split(':')[0]!} />
            <ScoreChart.Bar value="score" label="Intelligence" tone={(row) => ({ color: LAB_COLORS[row.lab]! })} />
            <ScoreChart.Tooltip />
        </ScoreChart.Root>
    );
}
