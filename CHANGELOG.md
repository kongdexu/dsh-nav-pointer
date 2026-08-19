# Changelog

All notable changes to this project are documented in this file.

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