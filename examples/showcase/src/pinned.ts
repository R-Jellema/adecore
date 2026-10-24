import { useState, type RefCallback } from 'react';

/*
 * A popup that floats over the window (a dialog, a palette) held at a place in the page instead, so
 * several stay open at once and each lands in the screenshot of its own section. `slot` goes on the
 * placeholder that reserves the room, `popup` on the popup itself, which the stylesheet takes out of
 * the fixed position.
 */
export function usePinned(): { slot: RefCallback<HTMLDivElement>; popup: RefCallback<HTMLElement> } {
    const [slot, setSlot] = useState<HTMLDivElement | null>(null);
    return {
        slot: setSlot,
        // A new callback once the slot is there, so React hands it the popup again.
        popup: (element) => {
            if (element === null || slot === null) {
                return;
            }
            const place = (): void => {
                const box = slot.getBoundingClientRect();
                element.style.top = `${Math.round(box.top + window.scrollY)}px`;
                element.style.left = `${Math.round(box.left + window.scrollX)}px`;
            };
            place();
            const observer = new ResizeObserver(place);
            observer.observe(document.body);
            return () => observer.disconnect();
        }
    };
}
