import { afterEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { configureAgentMarks } from './agent-marks';
import { AgentIcon } from './AgentIcon';

describe('AgentIcon', () => {
    afterEach(() => {
        configureAgentMarks({});
    });

    test('a built-in kind wears its own mark in a 24 by 24 box', () => {
        const markup = renderToStaticMarkup(createElement(AgentIcon, { kind: 'claude' }));
        expect(markup).toContain('aria-label="Claude"');
        expect(markup).toContain('viewBox="0 0 24 24"');
    });

    test('a kind the host added wears the mark the host gave it', () => {
        configureAgentMarks({ grok: { title: 'Grok', path: 'M1 1h22v22H1Z' } });
        const markup = renderToStaticMarkup(createElement(AgentIcon, { kind: 'grok' }));
        expect(markup).toContain('aria-label="Grok"');
        expect(markup).toContain('d="M1 1h22v22H1Z"');
        expect(markup).not.toContain('lucide-bot');
    });

    test('a host mark keeps the box it was drawn in', () => {
        configureAgentMarks({ antigravity: { title: 'Antigravity', path: 'M0 0h16v16H0Z', viewBox: '0 0 16 16' } });
        expect(renderToStaticMarkup(createElement(AgentIcon, { kind: 'antigravity' }))).toContain('viewBox="0 0 16 16"');
    });

    test('a host may draw a built-in kind its own way', () => {
        configureAgentMarks({ claude: { title: 'Claude', path: 'M2 2h20v20H2Z' } });
        expect(renderToStaticMarkup(createElement(AgentIcon, { kind: 'claude' }))).toContain('d="M2 2h20v20H2Z"');
    });

    test('a kind without any mark is a robot, also after the host configured others', () => {
        configureAgentMarks({ grok: { title: 'Grok', path: 'M1 1h22v22H1Z' } });
        expect(renderToStaticMarkup(createElement(AgentIcon, { kind: 'mystery' }))).toContain('lucide-bot');
    });

    test('a later configuration replaces the earlier one', () => {
        configureAgentMarks({ grok: { title: 'Grok', path: 'M1 1h22v22H1Z' } });
        configureAgentMarks({});
        expect(renderToStaticMarkup(createElement(AgentIcon, { kind: 'grok' }))).toContain('lucide-bot');
    });
});
