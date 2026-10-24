import { createChart } from '@adecore/charts';
import { formatDay, formatTokens } from '@adecore/ui/format';
import { tokensPerDay, type TokenDay } from '../shared/chart-data.ts';

const UsageChart = createChart<TokenDay>();
const days = tokensPerDay();

export default function TokensPerDayDemo() {
    return (
        <UsageChart.Root data={days} x="day" label="Tokens per day" height={220} className="w-full">
            <UsageChart.Grid />
            <UsageChart.YAxis format={formatTokens} />
            <UsageChart.XAxis format={(day) => formatDay(day as number)} />
            <UsageChart.Bars stack>
                <UsageChart.Bar value="input" label="Input" />
                <UsageChart.Bar value="output" label="Output" />
            </UsageChart.Bars>
            <UsageChart.Tooltip total />
            <UsageChart.Legend />
        </UsageChart.Root>
    );
}
