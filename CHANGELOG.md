# Changelog

All notable changes to this project are documented in this file.

## [0.2.0] - 2026-08-19

### Added

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

## [0.1.4] - 2026-08-19

### Added

- Scrub navigation: press and drag along the pointer rail to scrub through the
  conversation like a scrollbar. The pointer's Y position maps onto the
  scrollport's `scrollTop`; a plain click (no drag, under a 3px threshold)
  keeps the previous precise smooth-scroll-to-message behaviour, and the drag
  suppresses the click jump to avoid double-scrolling.

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