import type { ChartCurve, ChartX } from './types.ts';

export interface SeriesEntry {
    readonly kind: 'line' | 'area' | 'bar';
    readonly label: string;
    /* A CSS color, or null for the next color of the categorical series. */
    readonly color: string | null;
    /* A color per bucket, for columns colored by their row. */
    readonly rowColors: readonly string[] | null;
    readonly values: readonly (number | null)[];
    readonly stack: string | null;
    /* The `Chart.Bars` a column belongs to, which shares its bucket with the others in it. */
    readonly bars: string | null;
    readonly curve: ChartCurve;
}

export interface MarkerEntry {
    readonly at: ChartX;
    readonly label: string;
    readonly color: string;
}

export interface BandEntry {
    readonly from: ChartX;
    readonly to: ChartX;
    readonly label: string;
    readonly color: string;
}

export interface AxisSizes {
    /* The height under the plot the x axis takes, null without one. */
    readonly x: number | null;
    readonly left: number | null;
    readonly right: number | null;
    /* The widest label the x axis drew, which decides how many fit. */
    readonly xLabel: number | null;
    /* The number of ticks the y axis asks for. */
    readonly yTicks: number | null;
}

export interface ChartFormats {
    readonly x?: (x: ChartX) => string;
    readonly y?: (value: number) => string;
}

export interface ChartStore {
    subscribe(listener: () => void): () => void;
    series(): ReadonlyMap<string, SeriesEntry>;
    axes(): AxisSizes;
    markers(): ReadonlyMap<string, MarkerEntry>;
    bands(): ReadonlyMap<string, BandEntry>;
    formats(): ChartFormats;
    setSeries(id: string, entry: SeriesEntry | null): void;
    setAxis(axis: keyof AxisSizes, size: number | null): void;
    setMarker(id: string, entry: MarkerEntry | null): void;
    setBand(id: string, entry: BandEntry | null): void;
    setFormat<Axis extends keyof ChartFormats>(axis: Axis, format: ChartFormats[Axis]): void;
}

const same = (one: unknown, other: unknown): boolean => {
    if (Array.isArray(one) && Array.isArray(other)) {
        return one.length === other.length && one.every((value, i) => Object.is(value, other[i]));
    }
    return Object.is(one, other);
};

const sameEntry = (one: object | undefined, other: object): boolean =>
    one !== undefined && Object.entries(other).every(([key, value]) => same((one as Record<string, unknown>)[key], value));

/*
 * What the parts tell the root: the series with their values, the axes with the room they need, the
 * markers and bands, and the formats of the axes. Each is a snapshot of its own that only changes
 * when what is in it does, so a part that registers the same values again changes nothing.
 */
export function createChartStore(): ChartStore {
    const listeners = new Set<() => void>();
    let series: ReadonlyMap<string, SeriesEntry> = new Map();
    let axes: AxisSizes = { x: null, left: null, right: null, xLabel: null, yTicks: null };
    let markers: ReadonlyMap<string, MarkerEntry> = new Map();
    let bands: ReadonlyMap<string, BandEntry> = new Map();
    let formats: ChartFormats = {};

    const emit = (): void => {
        for (const listener of listeners) {
            listener();
        }
    };

    const updated = <Entry extends object>(map: ReadonlyMap<string, Entry>, id: string, entry: Entry | null): ReadonlyMap<string, Entry> | null => {
        if (entry === null) {
            if (!map.has(id)) {
                return null;
            }
            const next = new Map(map);
            next.delete(id);
            return next;
        }
        if (sameEntry(map.get(id), entry)) {
            return null;
        }
        // A changed entry keeps its place, so a series keeps its color while its values change.
        return new Map(map).set(id, entry);
    };

    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        series: () => series,
        axes: () => axes,
        markers: () => markers,
        bands: () => bands,
        formats: () => formats,
        setSeries(id, entry) {
            const next = updated(series, id, entry);
            if (next !== null) {
                series = next;
                emit();
            }
        },
        setAxis(axis, size) {
            if (axes[axis] !== size) {
                axes = { ...axes, [axis]: size };
                emit();
            }
        },
        setMarker(id, entry) {
            const next = updated(markers, id, entry);
            if (next !== null) {
                markers = next;
                emit();
            }
        },
        setBand(id, entry) {
            const next = updated(bands, id, entry);
            if (next !== null) {
                bands = next;
                emit();
            }
        },
        setFormat(axis, format) {
            if (formats[axis] !== format) {
                formats = { ...formats, [axis]: format };
                emit();
            }
        }
    };
}
