/* The screenshot script draws the page a part at a time and passes `offset`; only then are popups held
   open. A person browsing the page gets every overlay closed, so nothing modal takes the page's input. */
export const HELD = new URLSearchParams(window.location.search).has('offset');
