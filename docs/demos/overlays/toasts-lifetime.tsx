import { Button, Toasts, createToastStore } from '@adecore/ui';

const toasts = createToastStore();

function ping(): void {
    const id = toasts.getState().show({
        kind: 'error',
        title: 'New issue: WEB-142',
        description: 'TypeError: Cannot read properties of undefined',
        lifetime: 10_000,
        action: { label: 'Open', run: () => toasts.getState().dismiss(id) }
    });
}

export default function ToastsLifetimeDemo() {
    return (
        <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={ping}>
                Report an issue
            </Button>
            <Toasts store={toasts} />
        </div>
    );
}
