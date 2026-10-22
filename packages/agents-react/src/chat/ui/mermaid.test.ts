import { describe, expect, test } from 'bun:test';
import { render } from 'pele';
import { renderOptions, svgDataUrl, themedSvg } from './mermaid';

const FONT = { family: '"Inter", system-ui', mono: 'Menlo', size: 14 };

describe('renderOptions', () => {
    const options = renderOptions(FONT, 'mermaid-r1');

    test('lays the diagram out at its own size, in the font where it stands', () => {
        expect(options).toMatchObject({ responsive: false, idPrefix: 'mermaid-r1', fontFamily: '"Inter", system-ui', fontFamilyMono: 'Menlo', fontSize: 14 });
    });

    test('a diagram links to nothing and loads nothing', () => {
        expect(options).toMatchObject({ links: false, images: false });
        expect(options.math).toBeUndefined();
        expect(options.icons).toBeUndefined();
    });

    test('a click directive and a link in the text leave no trace in the drawing', () => {
        const { svg } = render('flowchart LR\n  A --> B\n  click A "https://example.com"\n  click B callback', options);
        expect(svg).not.toContain('example.com');
        expect(svg).not.toContain('<a ');
        expect(svg).not.toContain('<script');
    });
});

describe('themedSvg', () => {
    test('the colors reach the variables Pele draws with', () => {
        const { svg, width, height } = render('flowchart LR\n  A --> B', renderOptions(FONT, 'mermaid-r2'));
        const themed = themedSvg(svg, { '--pele-fg': '#111111', '--pele-surface': '#ffffff' });
        const root = /<svg\b[^>]*>/.exec(themed)![0];
        expect(root).toContain('style="--pele-fg:#111111;--pele-surface:#ffffff;');
        expect(root).toContain('var(--pele-fg,');
        expect(root).toContain(`width="${width}"`);
        expect(root).toContain(`height="${height}"`);
    });

    test('a value cannot leave the attribute it is written in', () => {
        const themed = themedSvg('<svg viewBox="0 0 1 1"></svg>', { '--pele-fg': '"><script>' });
        expect(themed).toBe('<svg style="--pele-fg:&quot;>&lt;script>;" viewBox="0 0 1 1"></svg>');
    });

    test('anything without a root is left as it was', () => {
        expect(themedSvg('no svg', { '--pele-fg': '#000000' })).toBe('no svg');
    });
});

test('svgDataUrl encodes the drawing whole', () => {
    expect(svgDataUrl('<svg>#</svg>')).toBe('data:image/svg+xml;charset=utf-8,%3Csvg%3E%23%3C%2Fsvg%3E');
});
