import type { ReactNode } from 'react';
import clsx from 'clsx';

/* A band of the page with a heading, under which its specimens sit in a grid of three columns. */
export function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
    return (
        <section id={id} className="flex flex-col gap-4">
            <header className="flex items-baseline gap-3 border-b border-border pb-2">
                <h2 className="text-lg font-semibold text-text">{title}</h2>
                {description && <p className="text-xs text-text-muted">{description}</p>}
            </header>
            <div className="grid grid-cols-3 gap-4">{children}</div>
        </section>
    );
}

/* One component or composition on the ground of the page, named over its frame. */
export function Specimen({
    name,
    caption,
    span = 1,
    plain = false,
    className,
    children
}: {
    name: string;
    caption?: string;
    span?: 1 | 2 | 3;
    /* Without the frame's padding, for a composition that brings its own edges. */
    plain?: boolean;
    className?: string;
    children: ReactNode;
}) {
    return (
        <figure className={clsx('flex min-w-0 flex-col gap-1.5', span === 2 && 'col-span-2', span === 3 && 'col-span-3')}>
            <figcaption className="flex items-baseline gap-2 px-0.5">
                <span className="text-sm font-medium text-text">{name}</span>
                {caption && <span className="truncate font-mono text-xs text-text-faint">{caption}</span>}
            </figcaption>
            <div
                className={clsx(
                    'relative flex min-w-0 grow flex-wrap items-start gap-3 rounded-lg border border-border-soft bg-bg',
                    plain ? 'p-0' : 'p-4',
                    className
                )}
            >
                {children}
            </div>
        </figure>
    );
}
