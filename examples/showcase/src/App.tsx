import { HELD } from './held.ts';
import { CompositionSection } from './sections/Compositions.tsx';
import { DemoSections } from './sections/Demos.tsx';
import { MatrixSection } from './sections/Matrix.tsx';
import { OverlaySection } from './sections/Overlays.tsx';

export function App({ theme }: { theme: 'dark' | 'light' }) {
    return (
        <main className="mx-auto flex w-full max-w-[1376px] flex-col gap-12 px-6 py-8">
            <header className="flex items-baseline gap-3">
                <h1 className="text-xl font-semibold text-text">ADE CORE showcase</h1>
                <span className="text-sm text-text-muted">Every component of @adecore/ui and @adecore/agents-react, {theme} theme</span>
            </header>
            <CompositionSection />
            <MatrixSection />
            {HELD && <OverlaySection />}
            <DemoSections folders={['actions', 'inputs', 'display', 'overlays', 'settings', 'layout', 'formatting', 'utilities', 'hooks', 'agents']} />
        </main>
    );
}
