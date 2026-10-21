import { expect, test } from 'bun:test';
import { isOnlyCommands } from './shell-commands.ts';

const ALLOWED = ['ruimte-context', 'echo'];

const SIMPLE: string[] = [
    'ruimte-context help && echo "--- AGENT ---" && ruimte-context help agent && echo "--- TEAM ---" && ruimte-context help team',
    'ruimte-context "a && b"',
    'ruimte-context help',
    'echo hi',
    'ruimte-context read node-1; echo done',
    'ruimte-context a || echo failed',
    'ruimte-context a\nruimte-context b',
    'ruimte-context a\n\nruimte-context b\n',
    'ruimte-context a &&\n  ruimte-context b',
    'ruimte-context a;',
    "ruimte-context node edit --text 'a | b > c $(d) `e`'",
    'ruimte-context node edit --text "*.ts and ?"',
    "echo 'it''s'",
    "echo it\\'s",
    'echo a\\;b',
    'echo a\\|b',
    'echo "quoted \\"inner\\" text"',
    'echo "price \\$5"',
    '"ruimte-context" help',
    'ruimte-context help \\\n  agent',
    '\techo  spaced\t',
    'echo a=b --flag=value',
    'echo ""',
    'echo 100%'
];

const REFUSED: string[] = [
    'ruimte-context x; rm -rf /',
    'ruimte-context x | sh',
    'echo $(id)',
    'echo `id`',
    'echo $HOME',
    'echo "$HOME"',
    'echo "$(id)"',
    'echo "`id`"',
    'echo hi > out.txt',
    'echo hi >> out.txt',
    'ruimte-context x 2> err.txt',
    'ruimte-context x < in.txt',
    'ruimte-context x <<EOF\nhi\nEOF',
    'diff <(echo a) <(echo b)',
    'ruimte-context x &',
    'ruimte-context x & rm y',
    'ruimte-context x &> all.txt',
    'ruimte-context x |& cat',
    '(ruimte-context x)',
    '{ ruimte-context x; }',
    'echo *',
    'echo file?.txt',
    'echo [ab]',
    'echo ~',
    'echo a{b,c}',
    'echo "unclosed',
    "echo 'unclosed",
    'echo trailing\\',
    'ruimte-context x &&',
    'ruimte-context x ||',
    '&& ruimte-context x',
    'ruimte-context x;; echo y',
    'ruimte-context x && && echo y',
    '; ruimte-context x',
    '',
    '   ',
    'rm -rf /',
    'ruimte-context x && rm y',
    './ruimte-context x',
    'FOO=1 ruimte-context x',
    'sh -c "ruimte-context x"',
    'echo hi # && rm y',
    '! ruimte-context x',
    'echo hi\nrm y'
];

for (const command of SIMPLE) {
    test(`allows ${JSON.stringify(command)}`, () => {
        expect(isOnlyCommands(command, ALLOWED)).toBe(true);
    });
}

for (const command of REFUSED) {
    test(`refuses ${JSON.stringify(command)}`, () => {
        expect(isOnlyCommands(command, ALLOWED)).toBe(false);
    });
}

test('nothing is allowed without a command to allow', () => {
    expect(isOnlyCommands('echo hi', [])).toBe(false);
});
