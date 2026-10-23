import { fileURLToPath } from 'node:url';
import { test } from 'bun:test';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PRELOAD = fileURLToPath(new URL('./testing/preload.ts', import.meta.url));
const files = [
    'file-tree/interaction.test.tsx',
    'workspace/interaction.test.tsx',
    'Slider.test.tsx',
    'Segmented.test.tsx',
    'settings/ConfirmDialog.test.tsx',
    'ColorWheelPicker.test.tsx',
    'Toasts.test.tsx',
    'lazy.test.ts'
];

// React and Base UI must first load with a DOM; isolate these from the server-rendered suite.
test.each(files)(
    '%s in a DOM',
    async (file) => {
        const child = Bun.spawn([process.execPath, 'test', '--preload', PRELOAD, `./src/${file}`], {
            cwd: ROOT,
            stdin: 'ignore',
            stdout: 'pipe',
            stderr: 'pipe',
            timeout: 50_000
        });
        const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
        if (code !== 0) {
            throw new Error(`${file} failed:\n${stderr}\n${stdout}`);
        }
    },
    60_000
);
