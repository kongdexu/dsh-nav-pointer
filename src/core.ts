// dsh-nav-pointer core: constants, CSS, pure geometry, and React-free DOM helpers.
// Everything in this file is unit-testable without React or the module loader.

export const PLUGIN_ID = 'dsh-nav-pointer'
export const STYLE_ID = 'dsh-nav-pointer-style'

/** Legacy runtime override (`window.__DSH_NAV_POINTER_SCROLL_MS__`), read once at module load.
 *  When present it still outranks the settings-documented `scrollMs` for backwards compatibility. */
export const WINDOW_SCROLL_MS_OVERRIDE: number | undefined =
  typeof window !== 'undefined' &&
  typeof (window as unknown as { __DSH_NAV_POINTER_SCROLL_MS__?: number }).__DSH_NAV_POINTER_SCROLL_MS__ === 'number'
    ? (window as unknown as { __DSH_NAV_POINTER_SCROLL_MS__: number }).__DSH_NAV_POINTER_SCROLL_MS__
    : undefined

export const MARKER_HEIGHT = 16
export const MARKER_GAP_DEFAULT = 1
export const ACTIVE_LINE_RATIO = 0.35
export const NAV_LOCK_MS = 600
export const SCRUB_THRESHOLD_PX = 3
export const BUBBLE_WIDTH = 240
export const PREVIEW_RAW_SLICE = 200
export const PREVIEW_MARKER_CHARS = 100

export interface UserRow {
  el: Element
  preview: string
}

export interface RailLayoutResult {
  gap: number
  railHeight: number
  topOffset: number
  leftOffset: number
}

// ── CSS ──────────────────────────────────────────────────────────────────

export const CSS = [
  '.dsh-msg-rail{position:fixed;width:36px;z-index:100;pointer-events:none;display:flex;flex-direction:column;align-items:flex-start}',
  '.dsh-msg-marker{pointer-events:auto;width:36px;height:16px;cursor:pointer;display:flex;align-items:center;flex:none;border-radius:4px;position:relative}',
  '.dsh-msg-marker > i{display:block;height:4px;border-radius:2px;background:var(--dsw-alias-label-tertiary);width:24px;transition:width .15s ease,background .15s ease}',
  '.dsh-msg-marker:hover > i{background:var(--dsw-alias-label-secondary);width:32px}',
  '.dsh-msg-marker.active > i{background:var(--dsw-static-deepseek-500);width:32px}',
  '.dsh-msg-bubble-wrap{position:fixed;transform:translateY(-50%);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease .3s;z-index:20}',
  '.dsh-msg-marker:hover .dsh-msg-bubble-wrap{opacity:1;visibility:visible;transition-delay:150ms}',
  '.dsh-msg-bubble{position:relative;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 85%,var(--dsw-alias-label-tertiary) 15%);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:6px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);width:240px;max-height:90px;overflow:hidden;white-space:normal;word-break:break-word;box-shadow:0 3px 10px rgba(0,0,0,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);text-overflow:ellipsis}',
  '.dsh-msg-bubble::before{content:"";position:absolute;left:-5px;top:50%;transform:translateY(-50%) rotate(-45deg);width:8px;height:8px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 85%,var(--dsw-alias-label-tertiary) 15%);border-left:1px solid var(--dsw-alias-border-l1);border-bottom:1px solid var(--dsw-alias-border-l1)}',
  '.dsh-msg-rail.scrubbing .dsh-msg-marker{cursor:grabbing}',
  '.dsh-msg-settings{display:flex;flex-direction:column;max-width:540px}',
  '.dsh-msg-settings-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--dsw-alias-border-l2)}',
  '.dsh-msg-settings-row:last-child{border-bottom:none}',
  '.dsh-msg-settings-text{display:flex;flex-direction:column;gap:2px;min-width:0}',
  '.dsh-msg-settings-label{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}',
  '.dsh-msg-settings-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.4}',
  '.dsh-msg-settings-num{width:96px;flex:none;padding:6px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit}',
  '.dsh-msg-settings-check{flex:none;width:16px;height:16px;accent-color:var(--dsw-static-deepseek-500)}',
].join('\n')

// ── Pure helpers ─────────────────────────────────────────────────────────

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

export function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…'
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function normalizePreview(raw: string): string {
  return truncate(raw.replace(/\s+/g, ' '), PREVIEW_MARKER_CHARS)
}

// ── DOM helpers ──────────────────────────────────────────────────────────

export function injectStyle(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID) !== null) return
  const tag = document.createElement('style')
  tag.id = STYLE_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
}

export function removeStyle(): void {
  if (typeof document === 'undefined') return
  const el = document.getElementById(STYLE_ID)
  if (el) el.remove()
}

export function collectUserRows(scrollport: Element | null): UserRow[] {
  if (!scrollport) return []
  const nodes = scrollport.querySelectorAll('[data-chat-flow-kind="user"]')
  const out: UserRow[] = []
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i]
    const text = (el.textContent || '').slice(0, PREVIEW_RAW_SLICE).trim()
    out.push({ el, preview: text })
  }
  return out
}

// ── Pure geometry ────────────────────────────────────────────────────────

/**
 * Compute the rail's internal layout given a count of markers and the available viewport height.
 * Returns gap (vertical space between markers), railHeight (total rail height inside viewport),
 * and topOffset/leftOffset (distance from scrollport top-left to rail top-left).
 *
 * When the natural rail (fixed 16px bars + 1px gaps) is shorter than viewport, the rail is
 * vertically centered. When it would overflow, gaps compress to 0 and the rail fills viewport.
 */
export function computeRailLayout(opts: {
  count: number
  viewportHeight: number
  barH?: number
  defaultGap?: number
}): RailLayoutResult {
  const barH = opts.barH ?? MARKER_HEIGHT
  const defaultGap = opts.defaultGap ?? MARKER_GAP_DEFAULT
  const count = Math.max(0, opts.count | 0)
  let gap = defaultGap
  let railHeight = count * barH + Math.max(0, count - 1) * gap
  if (count > 1 && railHeight > opts.viewportHeight) {
    gap = Math.max(0, (opts.viewportHeight - count * barH) / (count - 1))
    railHeight = opts.viewportHeight
  }
  const topOffset = clamp(
    (opts.viewportHeight - railHeight) / 2,
    0,
    Math.max(0, opts.viewportHeight - railHeight),
  )
  return { gap, railHeight, topOffset, leftOffset: 16 }
}

/**
 * Determine which marker should be highlighted as "active" given the current scroll.
 * When the user is at the very bottom (atBottom=true) the last marker is active —
 * this matches the common chat UX of anchoring to the latest message. Otherwise we
 * walk forward until a user row's top is below `threshold * viewportHeight` (default 35%).
 */
export function deriveActiveIndex(opts: {
  count: number
  rowTops: number[]
  viewportHeight: number
  threshold?: number
  atBottom?: boolean
}): number {
  const threshold = opts.threshold ?? ACTIVE_LINE_RATIO
  if (opts.count === 0) return -1
  if (opts.atBottom) return opts.count - 1
  let active = 0
  const line = opts.viewportHeight * threshold
  for (let i = 0; i < opts.count; i++) {
    if (opts.rowTops[i] <= line) active = i
    else break
  }
  return active
}
