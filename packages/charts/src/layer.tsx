import { useState, type ReactNode, type Ref } from 'react';
import { GroupContext, useChartContext } from './context.ts';
import { createAxisWidths } from './group-axes.ts';
import type { ChartX } from './types.ts';

export interface ChartLayerProps {
    readonly children?: ReactNode;
    readonly className?: string;
    readonly ref?: Ref<SVGGElement>;
}

export interface ChartGroupProps {
    readonly children?: ReactNode;
    readonly className?: string;
    readonly ref?: Ref<HTMLDivElement>;
}

/* A `<g>` in the plot for a drawing of the app's own, above the series. */
export function ChartLayer({ children, className, ref }: ChartLayerProps) {
    useChartContext('Chart.Layer');
    return (
        <g ref={ref} className={className}>
            {children}
        </g>
    );
}

/* Charts inside share the x under the pointer, and each snaps to its own nearest bucket. Their y axes take the width of the widest, so the plots line up. */
export function ChartGroup({ children, className, ref }: ChartGroupProps) {
    const [x, setX] = useState<ChartX | null>(null);
    const [widths] = useState(createAxisWidths);
    return (
        <GroupContext value={{ x, setX, widths }}>
            <div ref={ref} className={className}>
                {children}
            </div>
        </GroupContext>
    );
}
