/* The words are modules, not JSON: Node needs `with { type: 'json' }` on a JSON import, and a browser refuses it on the JavaScript Vite serves. */
import en from './locales/en.ts';
import nl from './locales/nl.ts';

/* The words of this package live in a namespace of their own, which the app adds to its i18next beside its own namespaces. */
export const CHARTS_NAMESPACE = 'charts';

/* Every language the package speaks, by language code: `i18n.addResourceBundle(language, CHARTS_NAMESPACE, words)` for each. */
export const CHARTS_RESOURCES: Readonly<Record<string, Record<string, unknown>>> = { en, nl };
