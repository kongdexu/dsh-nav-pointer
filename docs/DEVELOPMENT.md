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
Registration id: `message-pointer-rail`.

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

## Test

```sh
npm test
```

runs `test/smoke.mjs`, which loads `lib/client.js` against a mocked
`window.__ModuleLoader__` + React + document, and asserts:

- plugin exports `{ name, inject: ["slots"], apply }`
- `apply()` calls `ctx.slots.inject("shell.overlay", …)` and the returned
  callback registers id `message-pointer-rail`
- the injected CSS contains the expected class names and v17 marker
  geometry (`height:16px`)

## Release

```sh
npm version patch
npm publish --access public
git push --follow-tags
```