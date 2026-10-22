import { expect, test } from 'bun:test';
import { registerEffortStepper, stepEffortFromComposer } from './composer-effort';

test('a second composer of a chat steps while it is there, and the first takes over when it goes', () => {
    const stepped: string[] = [];
    const first = registerEffortStepper('scope/chat', () => stepped.push('first'));
    const second = registerEffortStepper('scope/chat', () => stepped.push('second'));
    expect(stepEffortFromComposer('scope/chat', 'up')).toBe(true);
    second();
    expect(stepEffortFromComposer('scope/chat', 'up')).toBe(true);
    first();
    expect(stepEffortFromComposer('scope/chat', 'up')).toBe(false);
    expect(stepped).toEqual(['second', 'first']);
});

test('the first composer to go leaves the second registered', () => {
    const stepped: string[] = [];
    const first = registerEffortStepper('scope/other', () => stepped.push('first'));
    const second = registerEffortStepper('scope/other', () => stepped.push('second'));
    first();
    expect(stepEffortFromComposer('scope/other', 'down')).toBe(true);
    second();
    expect(stepEffortFromComposer('scope/other', 'down')).toBe(false);
    expect(stepped).toEqual(['second']);
});
