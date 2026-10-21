import type { EffortStep } from './logic/effort';

/*
 * A command outside the composer, such as a menu row or a shortcut of the app, steps the reasoning effort
 * of a chat whose composer is on screen. Keyed with the scope's `keyOf`, like `sendFromComposer`.
 */
const steppers = new Map<string, (step: EffortStep) => void>();

export function registerEffortStepper(key: string, stepper: (step: EffortStep) => void): () => void {
    steppers.set(key, stepper);
    return () => {
        if (steppers.get(key) === stepper) {
            steppers.delete(key);
        }
    };
}

/* False when that chat has no composer on screen. At either end of the model's efforts the composer says so and nothing changes. */
export function stepEffortFromComposer(key: string, step: EffortStep): boolean {
    const stepper = steppers.get(key);
    if (stepper === undefined) {
        return false;
    }
    stepper(step);
    return true;
}
