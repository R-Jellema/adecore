import { useState } from 'react';
import { createChart } from '@adecore/charts';
import { LAB_COLORS, scoresByModel, type ModelScore } from '../shared/chart-data.ts';

const ScoreChart = createChart<ModelScore>();
const scores = scoresByModel();
const SHORT_EFFORTS: Record<string, string> = { low: 'low', medium: 'med', high: 'high', max: 'max' };

/* A stand-in for a lab's logo: its initial on its color. */
function LabMark({ lab }: { lab: string }) {
    return (
        <span
            aria-hidden
            className="flex size-5 items-center justify-center rounded-md text-2xs font-semibold text-accent-text"
            style={{ background: LAB_COLORS[lab] }}
        >
            {lab[0]}
        </span>
    );
}

export default function ScoresByModelDemo() {
    const [picked, setPicked] = useState<string[]>(['Lumen Pro:high']);
    const toggle = (row: ModelScore): void =>
        setPicked((current) => (current.includes(row.key) ? current.filter((key) => key !== row.key) : [...current.slice(-1), row.key]));

    return (
        <ScoreChart.Root
            data={scores}
            x="key"
            group="model"
            label="Scores per model and effort"
            y={{ min: 0, max: 80 }}
            height={240}
            minBucketWidth={28}
            selected={picked}
            onActivate={toggle}
            className="w-full"
        >
            <ScoreChart.Grid />
            <ScoreChart.YAxis ticks={4} />
            <ScoreChart.XAxis format={(key) => SHORT_EFFORTS[String(key).split(':')[1]!]!} />
            <ScoreChart.Bar
                value="score"
                label="Intelligence"
                tone={(row) => ({ color: LAB_COLORS[row.lab]! })}
                opacity={(_, indexInGroup) => 0.55 + indexInGroup * 0.15}
            />
            <ScoreChart.GroupAxis>
                {(group) => (
                    <>
                        <LabMark lab={group.rows[0]!.lab} />
                        <span className="leading-tight font-medium text-text">{group.key}</span>
                    </>
                )}
            </ScoreChart.GroupAxis>
            <ScoreChart.Tooltip />
        </ScoreChart.Root>
    );
}
