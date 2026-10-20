import { asObject, asString, int, type UsageRecord } from '../record.ts';

/*
 * One call to a subscription API, a line of the usage log a host keeps. Such an API has no CLI and so no
 * transcript of its own, so the host that makes the calls writes this line for each one. The counts are
 * the OpenAI-style ones the API reports: `prompt` holds the cached part, and `completion` holds the reasoning.
 */
export interface NanoGptUsageEntry {
    at: number;
    model: string;
    session: string;
    cwd: string;
    prompt: number;
    cached: number;
    completion: number;
    reasoning: number;
}

export function nanoGptUsageLine(entry: NanoGptUsageEntry): string {
    return `${JSON.stringify(entry)}\n`;
}

/* A line of this log names its model, which keeps `JSON.parse` off anything else a folder holds. */
export function nanoGptMightCarryUsage(line: string): boolean {
    return line.includes('"model"');
}

export function parseNanoGptLine(line: string): UsageRecord | null {
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
    // Token kinds are disjoint in a total, so what was read from the cache leaves the input.
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
        provider: 'nanogpt',
        timestampMs,
        model,
        sessionId: asString(entry.session),
        cwd: asString(entry.cwd),
        totals,
        // Every line is a call of its own, so nothing is folded.
        dedupeKey: null
    };
}
