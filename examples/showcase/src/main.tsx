import { createRoot } from 'react-dom/client';
import { UIProvider } from '@adecore/ui';
import { i18n } from '../../../docs/demos/shared/i18n.ts';
import { formatSource } from '../../../docs/demos/shared/preferences.ts';
import { DemoChatHost } from '../../../docs/demos/shared/agents.tsx';
import { App } from './App.tsx';
import './styles.css';

const query = new URLSearchParams(window.location.search);
const theme = query.get('theme') === 'light' ? 'light' : 'dark';
document.documentElement.dataset.theme = theme;

// Headless Chrome draws no window much taller than 16,000px, so the screenshot script takes the page a
// part at a time: `offset` moves it up before anything is placed, and every popup is placed against that.
// The popups held open move the focus into themselves, which would scroll the window away from the part.
const offset = query.get('offset');
if (offset !== null) {
    document.body.style.marginTop = `${-Number(offset)}px`;
    window.setTimeout(() => window.scrollTo(0, 0), 4000);
}

createRoot(document.getElementById('root')!).render(
    <UIProvider i18n={i18n} formatSource={formatSource}>
        {/* Around everything, so the code blocks and diffs outside a chat follow the theme too. */}
        <DemoChatHost>
            <App theme={theme} />
        </DemoChatHost>
    </UIProvider>
);

// The screenshot script sizes its parts to these, read from the DOM once everything has drawn. It cuts
// only above a section or a specimen, so no popup is cut in two or flips up against a part's lower edge.
window.setTimeout(() => {
    const root = document.documentElement;
    root.dataset.height = String(root.scrollHeight);
    root.dataset.cuts = [...document.querySelectorAll('section, figure')]
        .map((element) => Math.round(element.getBoundingClientRect().top + window.scrollY))
        .join(',');
}, 3000);
