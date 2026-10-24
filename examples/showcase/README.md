# Showcase example

One page that draws every component of `@adecore/ui` and `@adecore/agents-react`, for a review of the whole design system after a change to the theme. It is private and never published.

The page opens with compositions (a side panel with a file tree and a commit box beside a chat, a settings dialog, a start screen), then every variant and size of the buttons and fields, then the menus, popovers, dialogs and toasts held open in place. After that come the docs' demos, by group, with the same data as on the docs site. `?theme=light` or `?theme=dark` (the default) picks the theme.

## Build and screenshots

```sh
bun install
bun run --cwd examples/showcase build
bun run --cwd examples/showcase screenshot <directory>
```

`build` writes `dist`, which opens from `file://`. `screenshot` builds and draws the page with headless Chrome into `dark-01.png`, `dark-02.png`, ... and `light-01.png`, ..., each at most 4000px tall and cut only above a section or a specimen. Set `CHROME` to use another Chrome binary than the one in `/Applications`.
