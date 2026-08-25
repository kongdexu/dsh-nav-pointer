# Changelog

All notable changes to this project are documented in this file.

## [0.3.0] - 2026-08-25

### Added

- Settings-panel integration: host now registers a `dsh-nav-pointer`
  schemastery settings namespace (`installSettingsSection` + an exported
  `Config` schema), and the client binds it through `ctx.settingsScope`
  (`@deepseek-ai/dsh-client-ui-settings`) and registers a `settings.section`
  page. Four live, DSH-persisted preferences: jump duration (`scrollMs`, 60–2000
  ms), rail on/off, hover-bubble on/off, and Alt+arrow keyboard jumps. The
  legacy `window.__DSH_NAV_POINTER_SCROLL_MS__` override still outranks
  `scrollMs` for backwards compatibility. Rail marker compression stays a
  fixed behaviour (no toggle): a long conversation always compresses gaps to
  fill the viewport.

### Changed

- Rewrote the client/host sources in TypeScript under `src/`, splitting the
  React-free core (CSS constants, clamp/truncate/ease-out curve, rail layout
  compression, active-marker derivation, preview normalization, user-row
  collection) into `src/core.ts` for unit-testability. Built output in `lib/` is
  produced by esbuild (`build.mjs`): `lib/client.js` keeps the exact
  `window.__ModuleLoader__.load` + `react`-external ABI, `lib/index.js` stays a
  plain ESM host entry with `@deepseek-ai/dsh-settings`/`@deepseek-ai/schemastery`
  kept external. Runtime behavior is unchanged.
- Added vitest + jsdom behavior tests (`test/*.test.ts`) and kept
  `test/smoke.mjs` as the built-artifact loading contract. `npm run check` now
  runs typecheck → build → vitest → smoke; CI runs `npm ci && npm run check` and
  fails if committed `lib/` drifts from `src/`.

## [0.2.0] - 2026-08-24

### Added

- Scrub navigation: press and drag along the pointer rail to scrub through the
  conversation like a scrollbar. The pointer's Y position maps onto the
  scrollport's `scrollTop`; a plain click (no drag, under a 3px threshold)
  keeps the precise jump behaviour, and the drag suppresses the click jump to
  avoid double-scrolling.
- Keyboard shortcuts:
  - `Alt+↑` / `Alt+↓` → jump to previous/next user message
  - `Alt+Shift+↑` / `Alt+Shift+↓` → jump to first/last user message

### Changed

- Click and keyboard jumps use a fixed-duration (260 ms) eased scroll instead of
  the browser's distance-based native smooth scroll, so long jumps no longer
  feel slow. The duration is tunable at runtime via
  `window.__DSH_NAV_POINTER_SCROLL_MS__`; mouse-wheel, touch, or rail-drag input
  interrupts the animation so it never fights manual scrolling.

### Fixed

- Clicking a marker whose message was already fully in view (e.g. two user
  messages fit on screen and the conversation cannot scroll) previously left the
  highlighted marker unchanged, because the highlight was derived only from
  scroll position and no scroll actually occurred. Clicks and keyboard jumps now
  set the active marker immediately and briefly hold it through the scroll, so
  the marker color always updates.

## [0.1.3] - 2026-08-19

### Fixed

- Switching to a different session no longer moves the pointer rail to the
  screen's top-left corner. The cached `[data-conversation-scroll]` node is now
  re-validated (`isConnected`) and re-queried on session switch, the mutation
  observer is re-attached to the new scrollport, and detached/zero-size
  scrollports clear the rail instead of painting with stale all-zero geometry.

## [0.1.2] - 2026-08-19

### Added

- Module-loader smoke test (`npm test`) covering export shape, slot
  registration, and injected CSS geometry.
- `docs/DEVELOPMENT.md`, `CHANGELOG.md`, GitHub Actions CI, and LF line-ending
  normalization (`.gitattributes`).

### Changed

- README install section now documents the canonical
  `dsh plugin --profile web add dsh-nav-pointer` command, plus the pnpm
  `minimumReleaseAge` bypass for freshly published packages.

## [0.1.1] - 2026-08-19

### Fixed

- `dsh.client.inject` now declares the official client packages
  (`@deepseek-ai/dsh-client-runtime`, `@deepseek-ai/dsh-client-ui-slots`)
  instead of the Cordis service name `slots`, so the loader resolves the
  `slots` service and React correctly.
- `repository.url` normalized to `git+https://…` form.
- Package name changed from `dsh-message-pointer` to `dsh-nav-pointer` to
  match the repository `kongdexu/dsh-nav-pointer`.

## [0.1.0] - 2026-08-19

### Added

- Initial release: vertical message pointer rail on the left edge of the chat.
  - One dash marker per user message.
  - Click to smooth-scroll to that message.
  - Hover preview bubble with the message text.
  - Active-marker highlight that follows the viewport.
  - Theme-aware colors (light/dark) via DSH design tokens.