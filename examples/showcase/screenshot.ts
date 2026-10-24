/*
 * Screenshots of the built page in both themes, in parts of at most `PART_HEIGHT` pixels:
 * `bun screenshot.ts <directory>` after `bun run build`. Set `CHROME` to use another Chrome binary
 * than the one in /Applications.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const WIDTH = 1440;
const PART_HEIGHT = 4000;
// Above a section or a specimen, so its heading stays with it.
const CUT_MARGIN = 16;
const PAGE = fileURLToPath(new URL('./dist/index.html', import.meta.url));

const target = process.argv[2];
if (target === undefined) {
    console.error('Usage: bun screenshot.ts <directory>');
    process.exit(1);
}
mkdirSync(target, { recursive: true });

// A module script from file:// is refused without the flag.
const CHROME_FLAGS = ['--headless=new', '--allow-file-access-from-files', '--hide-scrollbars', '--force-device-scale-factor=1', '--virtual-time-budget=6000'];

async function run(command: string[]): Promise<string> {
    const child = Bun.spawn(command, { stdout: 'pipe', stderr: 'ignore' });
    const output = await new Response(child.stdout).text();
    if ((await child.exited) !== 0) {
        throw new Error(`${command[0]} failed`);
    }
    return output;
}

/* The page's height and the places it may be cut, which it writes on `<html>` once it has drawn. */
async function measure(url: string): Promise<{ height: number; cuts: number[] }> {
    const dom = await run([CHROME, ...CHROME_FLAGS, `--window-size=${WIDTH},2000`, '--dump-dom', url]);
    const height = /data-height="(\d+)"/.exec(dom);
    const cuts = /data-cuts="([\d,]*)"/.exec(dom);
    if (height === null || cuts === null) {
        throw new Error('The page never wrote its height; did it fail to load?');
    }
    return {
        height: Number(height[1]),
        cuts: cuts[1]!
            .split(',')
            .map((cut) => Number(cut) - CUT_MARGIN)
            .sort((left, right) => left - right)
    };
}

/* The tops of the parts: each as far down as a cut allows, or a full part on where none does. */
function partsOf(height: number, cuts: number[]): { offset: number; height: number }[] {
    const parts: { offset: number; height: number }[] = [];
    let offset = 0;
    while (offset < height) {
        const limit = offset + PART_HEIGHT;
        const next = limit >= height ? height : (cuts.filter((cut) => cut > offset && cut <= limit).at(-1) ?? limit);
        parts.push({ offset, height: next - offset });
        offset = next;
    }
    return parts;
}

for (const theme of ['dark', 'light']) {
    const { height, cuts } = await measure(`file://${PAGE}?theme=${theme}&offset=0`);
    const parts = partsOf(height, cuts);
    for (const [i, part] of parts.entries()) {
        const out = join(target, `${theme}-${String(i + 1).padStart(2, '0')}.png`);
        await run([
            CHROME,
            ...CHROME_FLAGS,
            `--window-size=${WIDTH},${part.height}`,
            `--screenshot=${out}`,
            `file://${PAGE}?theme=${theme}&offset=${part.offset}`
        ]);
        console.log(`${out} (${part.height}px)`);
    }
}
