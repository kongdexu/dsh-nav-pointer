# Development

## DOM hooks

The plugin uses stable DOM attributes documented by
`@deepseek-ai/dsh-client-ui-conversation`. These are the only DOM contract it
relies on — everything else is read-only via `getBoundingClientRect`.

| Attribute | Purpose |
|---|---|
| `[data-conversation-scroll]` | The chat scrollport (listens for scroll, reads `scrollTop`/`scrollHeight`/`clientHeight`). |
| `[data-chat-flow-kind="user"]` | User message rows; one marker per row. |
| `[data-composer-seat]` | Sticky composer inside the scrollport; rail's bottom edge clamps above it. |

## Slot

Mounted in `shell.overlay` (`list` slot, additive — never replaces built-in UI).
Registration id: `message-pointer-rail`. The component receives `{ scope }`
(bound settings scope) via the slot `inject` face.

A second slot `settings.section` (`list`, id `dsh-nav-pointer`, `order: 200`)
adds the "消息指针" page to the DSH Settings panel; it renders five
schema-backed controls and routes edits through `scope.set(field, value)`.

## Settings

The host registers a schemastery namespace through
`ctx.settings.installSection` via an optional `ctx.inject(['settings'], …)`
consumer block (`src/index.ts`, exported `Config` schema, composition entry
config as the `base`/fallback layer). The client injects `settingsScope`
(provided by `@deepseek-ai/dsh-client-ui-settings`) and binds it once in
`apply`:

```ts
const scope = ctx.settingsScope?.bind<NavPointerConfig>({ namespace: SETTINGS_NAMESPACE })
```

- Reads are reactive: `useNavPointerConfig` subscribes via `scope.subscribe`
  and resolves `scope.getSnapshot().value ?? DEFAULT_CONFIG`.
- Writes queue through `scope.set(field, value)` (revision-fenced, latest wins).
- The RAF/keyboard effects read `configRef.current` so config changes apply live
  without re-binding listeners; the render gate reads `config.railEnabled`.
  Rail marker gap compression is a fixed behaviour — `computeRailLayout`
  always compresses to fill the viewport when the natural rail would overflow,
  so it is not exposed as a setting.
- `window.__DSH_NAV_POINTER_SCROLL_MS__` is read once at module load and, when
  present, outranks `config.scrollMs` for backwards compatibility.
- The settings namespace/schema, `client.inject` (`@deepseek-ai/dsh-client-ui-settings`)
  and host `peerDependencies` (`@deepseek-ai/dsh-settings`, `@deepseek-ai/schemastery`)
  must all stay in lockstep with `src/config.ts`.

## Geometry tracking

A `requestAnimationFrame` loop builds a geometry signature each frame
(`scrollport.left | top | width | viewportBottom | scrollTop | userCount`)
and only calls `setState` when the signature changes. This avoids
continuously re-rendering while still tracking sidebar open/close, column
width changes, and any layout shift that doesn't fire `resize`/`scroll`.

- `MutationObserver` on the scrollport (`childList`/`subtree`/`characterData`)
  invalidates the signature when messages are added/edited/removed.
- A capture-phase `scroll` listener updates bubble positions during smooth
  scroll (bubble wraps are `position: fixed`).

## Scrub navigation

- `mousedown` on a marker (bubbling to the rail) arms a scrub session; a
  window-level `mousemove`/`mouseup` pair tracks the drag outside the 36px rail.
- The first move past a 3px threshold marks it a drag, sets the `scrubbing`
  state (adds the `.scrubbing` class → `cursor: grabbing`), and starts mapping
  `clientY` onto `scrollTop`: `f = (clientY - railTop) / railHeight`, then
  `scrollport.scrollTop = clamp(f, 0, 1) * (scrollHeight - clientHeight)`.
- A click without drag keeps the precise `jumpToRow` animation; the drag path
  leaves `moved = true` so `handleClick` skips the click event the browser fires
  on mouseup, preventing a double jump. Dragging also cancels any in-flight
  click-jump animation (`cancelScrollAnim`).

## Jump animation

Click and keyboard jumps animate via `jumpToRow` → `animateScrollTo` instead of
the browser's native `scrollIntoView({ behavior: "smooth" })`. The native
duration is distance-based and reads as slow on long conversations; this
implementation drives `scrollTop` through `requestAnimationFrame` with an
`easeOutCubic` curve over a fixed `SCROLL_DURATION_MS` (default 260 ms).

- Target `scrollTop` is `scrollTop + (row.top - scrollport.top)`, clamped to
  `[0, scrollHeight - clientHeight]` — the same alignment `block: "start"` gave.
- `SCROLL_DURATION_MS` is read once at module load from
  `window.__DSH_NAV_POINTER_SCROLL_MS__` (falls back to 260), so runtime tuning
  requires a page refresh after setting the global.
- `scrollAnimRef` holds the active animation; a new jump, a rail drag, or a
  `wheel`/`touchstart` event cancels it, so programmatic scrolling never fights
  manual scrolling.

## Keyboard shortcuts

A single `document`-level `keydown` listener (empty dependency array, never
re-bound) handles `Alt+ArrowUp/Down`. It is registered on the **capture
phase** so rich-text editors (Slate/ProseMirror in the composer) and other
React handlers that `stopPropagation` during bubble can't swallow the combo
before the rail sees it. On match it calls `preventDefault()` +
`stopPropagation()` immediately (before the browser menu bar, IME candidate
navigation, or editor handlers can eat the key), accepts both `e.key` and
`e.code` spellings (`ArrowUp`/`Up`), and only then computes the target.

It reads the current active index from `activeIndexRef` (a ref synced on
every paint so the listener always sees the fresh value without needing to
re-attach) and `userRowsRef.current`, then calls `jumpToRow(row)` to drive a
fixed-duration smooth scroll to the target. `Alt+Shift+ArrowUp/Down` jumps to
the first/last user message. The handler only prevents default for `Alt`
without `Ctrl`/`Meta`, so other app and OS shortcuts pass through.

## Theme

All colors use DSH design tokens so the rail auto-adapts to light/dark themes:

- `--dsw-alias-bg-base`, `--dsw-alias-bg-layer-1`
- `--dsw-alias-border-l1` / `-l2`
- `--dsw-alias-label-primary` / `-secondary` / `-tertiary`
- `--dsw-static-deepseek-500` (active marker)

Bubble background is `color-mix(in srgb, bg-layer-1 85%, label-tertiary 15%)`
with `backdrop-filter: blur(8px)`.

## Bubble positioning

Bubble wraps use `position: fixed` with JS-computed `left/top` rather than
absolute positioning inside the rail. The rail is flex-aligned and `width:36px`,
so an absolutely-positioned child inherits the collapsed width and lays
Chinese text out one character per line. Fixed positioning with an explicit
`width:240px` sidesteps that.

## Build

TypeScript sources live under `src/`; `lib/` is generated by esbuild and committed
so the packaged tree matches the source. `build.mjs`:

- bundles `src/client.ts` into `lib/client.js` (`iife` + `globalName`, `react`
  external) wrapped in `window.__ModuleLoader__.load({ id, factory(require) { … } })`
  — identical to the DSH Web client loading ABI;
- emits `src/index.ts` (host) as plain ESM to `lib/index.js`;
- copies `src/types/**` to `lib/types/**`.

React is never inlined: it is resolved from the module loader's `require("react")`,
so the plugin shares the app's single React instance.

## Test

```sh
npm run check      # typecheck → build → vitest → smoke (CI runs this)
npm run typecheck  # tsc --noEmit on src/ + test/
npm run build      # regenerate lib/
npm test           # vitest run — behavior tests (jsdom)
npm run test:smoke # node test/smoke.mjs — built-artifact loading contract
```

- `test/core.test.ts` — unit tests for the React-free `src/core.ts` pure functions:
  `clamp`/`truncate`/`easeOutCubic`/`normalizePreview`, `computeRailLayout` (natural
  height centering + gap-compression-to-viewport when overflowing), and
  `deriveActiveIndex` (bottom-anchoring + 35%-line walk + custom threshold).
- `test/dom.test.ts` — jsdom tests for `collectUserRows` (one marker per
  `[data-chat-flow-kind="user"]`, ignores other kinds, 200-char raw slice + trim)
  and CSS injection idempotence/cleanup.
- `test/smoke.mjs` evaluates the built `lib/client.js` against a mocked
  `window.__ModuleLoader__` + React + document, asserting:
  - plugin exports `{ name, inject: ["slots"], apply }`
  - `apply()` calls `ctx.slots.inject("shell.overlay", …)` and registers id
    `message-pointer-rail`
  - the injected CSS contains the expected class names and v17 marker geometry
    (`height:16px`)

## Release

```sh
npm version patch
npm publish --access public
git push --follow-tags
```