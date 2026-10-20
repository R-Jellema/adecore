import { describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CliMark } from './parts';

describe('CliMark', () => {
    test('a known CLI wears its mark in its chart color', () => {
        const markup = renderToStaticMarkup(createElement(CliMark, { kind: 'claude' }));
        expect(markup).toContain('text-chart-claude');
        expect(markup).toContain('aria-label="Claude"');
    });

    test('a CLI this version has no mark for falls back to a muted bot', () => {
        const markup = renderToStaticMarkup(createElement(CliMark, { kind: 'grok' }));
        expect(markup).toContain('text-text-muted');
        expect(markup).toContain('lucide-bot');
        expect(markup).not.toContain('text-chart-');
    });
});
