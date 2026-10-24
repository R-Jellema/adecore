import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
    root: fileURLToPath(new URL('./src', import.meta.url)),
    // The page is opened from file:// for a screenshot, where an absolute asset path would point at the filesystem root.
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
        // The packages and the docs' demos are read from their source, so a change in them needs no build.
        conditions: ['source', ...defaultClientConditions],
        // The demos resolve their dependencies from `docs`, the packages from the repository root; one copy each or hooks and words break.
        dedupe: ['react', 'react-dom', 'i18next', 'react-i18next']
    },
    build: {
        outDir: fileURLToPath(new URL('./dist', import.meta.url)),
        emptyOutDir: true,
        target: 'chrome140',
        cssTarget: 'chrome140',
        // One page that draws everything; splitting it buys nothing.
        chunkSizeWarningLimit: 20_000
    }
});
