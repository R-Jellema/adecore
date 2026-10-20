import { asObject, asString, int, type UsageRecord } from '../record.ts';

export interface AnthropicClaudeApiUsageEntry {
    at: number;
    model: string;
    session: string;
    cwd: string;
    prompt: number;
    cached: number;
    completion: number;
    reasoning: number;
}

export function anthropicClaudeApiUsageLine(entry: AnthropicClaudeApiUsageEntry): string {
    return `${JSON.stringify(entry)}\n`;
}

export function anthropicClaudeApiMightCarryUsage(line: string): boolean {
    return line.includes('"model"');
}

export function parseAnthropicClaudeApiLine(line: string): UsageRecord | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(line);
    } catch {
        return null;
    }
    const entry = asObject(parsed);
    if (entry === null) {
        return null;
    }
    const model = asString(entry.model);
    const timestampMs = typeof entry.at === 'number' && Number.isFinite(entry.at) ? entry.at : Number.NaN;
    if (model === '' || Number.isNaN(timestampMs)) {
        return null;
    }
    const prompt = int(entry.prompt);
    const cacheRead = Math.min(prompt, int(entry.cached));
    const totals = {
        calls: 1,
        input: prompt - cacheRead,
        cacheRead,
        cacheWrite: 0,
        cacheWrite1h: 0,
        output: int(entry.completion),
        reasoning: int(entry.reasoning)
    };
    if (totals.input + totals.cacheRead + totals.output === 0) {
        return null;
    }
    return {
        provider: 'anthropic-claude-api',
        timestampMs,
        model,
        sessionId: asString(entry.session),
        cwd: asString(entry.cwd),
        totals,
        dedupeKey: null
    };
}