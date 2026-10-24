import { $ } from 'bun';
import { compileReactDist, describeReactCompilerReport } from '../../../scripts/react-compiler.ts';
import { rm } from 'node:fs/promises';

/* One JavaScript file and one declaration file per source file. */
await rm('dist', { recursive: true, force: true });
await $`tsc -p tsconfig.build.json`;
console.log(describeReactCompilerReport('charts', await compileReactDist('dist')));
