// dsh-nav-pointer client half: React component + plugin entry.
// Loaded via window.__ModuleLoader__ by the DSH Web client at runtime.

import * as React from 'react'
import {
  PLUGIN_ID,
  WINDOW_SCROLL_MS_OVERRIDE,
  MARKER_HEIGHT,
  RAIL_WIDTH,
  RAIL_LEFT_OFFSET,
  ACTIVE_LINE_RATIO,
  NAV_LOCK_MS,
  SCRUB_THRESHOLD_PX,
  clamp,
  easeOutCubic,
  normalizePreview,
  collectUserRows,
  computeRailLayout,
  deriveActiveIndex,
  injectStyle,
  removeStyle,
  type UserRow,
} from './core'
import {
  SETTINGS_NAMESPACE,
  DEFAULT_CONFIG,
  type NavPointerConfig,
} from './config'

// ── Local settings-scope types (mirror @deepseek-ai/dsh-client-*/settings contract) ─

interface SettingsScopeSnapshot<T> {
  status: 'loading' | 'ready' | 'unavailable'
  value?: T
  base?: unknown
  user?: unknown
  revision?: number
  writable: boolean
  mode: 'host' | 'memory'
}

interface SettingsScope<T> {
  getSnapshot(): SettingsScopeSnapshot<T>
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<void>
  unset(field: string): Promise<void>
}

interface SettingsScopeBinder {
  bind<T>(spec: { namespace: string; decode?: (section: unknown) => T | undefined }): SettingsScope<T>
}

// ── Local types ──────────────────────────────────────────────────────────

interface Marker {
  preview: string
  index: number
}

interface BubblePos {
  left: number
  top: number
}

interface RailPos {
  left: number
  top: number
  height: number
  gap: number
}

interface ScrubState {
  active: boolean
  moved: boolean
  startY: number
}

interface NavLock {
  index: number
  until: number
}

interface ScrollAnimRecord {
  rafId: number | null
}

interface SlotRegisterOptions {
  name: string
  id?: string
  order?: number
  label?: () => string
  inject?: () => Record<string, unknown>
}

interface SlotsService {
  inject(name: string, factory: () => () => void): void
  register(opts: SlotRegisterOptions, Component: React.ComponentType<any>): () => void
}

interface ClientCtx {
  slots: SlotsService
  settingsScope?: SettingsScopeBinder
  effect(fn: () => () => void, label?: string): void
}

interface RailProps {
  scope?: SettingsScope<NavPointerConfig>
}

interface SettingsSectionProps {
  scope?: SettingsScope<NavPointerConfig>
  close?: () => void
}

// ── Settings subscription hook ──────────────────────────────────────────

function useNavPointerConfig(scope: SettingsScope<NavPointerConfig> | undefined): NavPointerConfig {
  const [config, setConfig] = React.useState<NavPointerConfig>(
    () => scope?.getSnapshot().value ?? DEFAULT_CONFIG,
  )
  React.useEffect(() => {
    if (!scope) return
    const refresh = () => setConfig(scope.getSnapshot().value ?? DEFAULT_CONFIG)
    refresh()
    return scope.subscribe(refresh)
  }, [scope])
  return config
}

// ── Settings section (rendered inside the Settings panel) ───────────────

function SettingsSection(props: SettingsSectionProps): React.ReactElement {
  const scope = props.scope
  const config = useNavPointerConfig(scope)
  const write = (field: string, value: unknown) => {
    if (!scope) return
    scope.set(field, value).catch(() => { /* keep the last good snapshot */ })
  }

  const numberRow = (
    label: string,
    hint: string,
    value: number,
    onCommit: (n: number) => void,
  ) =>
    React.createElement(
      'div',
      { className: 'dsh-msg-settings-row' },
      React.createElement(
        'div',
        { className: 'dsh-msg-settings-text' },
        React.createElement('div', { className: 'dsh-msg-settings-label' }, label),
        React.createElement('div', { className: 'dsh-msg-settings-hint' }, hint),
      ),
      React.createElement('input', {
        className: 'dsh-msg-settings-num',
        type: 'number',
        min: 60,
        max: 2000,
        value,
        onChange: (e) => {
          const n = Number((e.target as HTMLInputElement).value)
          if (Number.isFinite(n)) onCommit(Math.min(2000, Math.max(60, Math.round(n))))
        },
      }),
    )

  const toggleRow = (
    label: string,
    hint: string,
    value: boolean,
    onToggle: (b: boolean) => void,
  ) =>
    React.createElement(
      'div',
      { className: 'dsh-msg-settings-row' },
      React.createElement(
        'div',
        { className: 'dsh-msg-settings-text' },
        React.createElement('div', { className: 'dsh-msg-settings-label' }, label),
        React.createElement('div', { className: 'dsh-msg-settings-hint' }, hint),
      ),
      React.createElement('input', {
        className: 'dsh-msg-settings-check',
        type: 'checkbox',
        checked: value,
        onChange: (e) => onToggle((e.target as HTMLInputElement).checked),
      }),
    )

  return React.createElement(
    'div',
    { className: 'dsh-msg-settings' },
    numberRow('滚动时长', '点击 / 键盘跳转动画时长（毫秒）', config.scrollMs, (n) => write('scrollMs', n)),
    toggleRow('显示指针导轨', '关闭后不渲染消息指针导轨', config.railEnabled, (b) => write('railEnabled', b)),
    toggleRow('悬停预览气泡', '鼠标悬停标记时显示消息预览', config.bubbleEnabled, (b) => write('bubbleEnabled', b)),
    toggleRow('键盘跳转', 'Alt+↑/↓ 在用户消息间跳转', config.keyboardEnabled, (b) => write('keyboardEnabled', b)),
  )
}

// ── Component ────────────────────────────────────────────────────────────

function MessagePointerRail(props: RailProps): React.ReactElement | null {
  const config = useNavPointerConfig(props.scope)
  const scrollMs = WINDOW_SCROLL_MS_OVERRIDE ?? config.scrollMs
  const configRef = React.useRef<NavPointerConfig>(config)
  configRef.current = config
  const scrollMsRef = React.useRef<number>(scrollMs)
  scrollMsRef.current = scrollMs

  const [markers, setMarkers] = React.useState<Marker[]>([])
  const [activeIndex, setActiveIndex] = React.useState<number>(-1)
  const [rail, setRail] = React.useState<RailPos>({ left: 0, top: 0, height: 0, gap: 1 })
  const [bubbles, setBubbles] = React.useState<Record<number, BubblePos>>({})
  const [scrubbing, setScrubbing] = React.useState<boolean>(false)
  const [railHidden, setRailHidden] = React.useState<boolean>(false)

  const scrollportRef = React.useRef<Element | null>(null)
  const userRowsRef = React.useRef<UserRow[]>([])
  const markerRefs = React.useRef<Array<HTMLDivElement | null>>([])
  const railRef = React.useRef<HTMLDivElement | null>(null)
  const scrubRef = React.useRef<ScrubState>({ active: false, moved: false, startY: 0 })
  const activeIndexRef = React.useRef<number>(-1)
  const navLockRef = React.useRef<NavLock | null>(null)
  const scrollAnimRef = React.useRef<ScrollAnimRecord | null>(null)

  const setMarkerRef = React.useCallback((i: number) => {
    return (el: HTMLDivElement | null) => {
      markerRefs.current[i] = el
    }
  }, [])

  // ── Scrolling / animation ────────────────────────────────────────────

  const activateMarker = React.useCallback((index: number) => {
    setActiveIndex(index)
    activeIndexRef.current = index
    navLockRef.current = { index, until: Date.now() + NAV_LOCK_MS }
  }, [])

  const cancelScrollAnim = React.useCallback(() => {
    const rec = scrollAnimRef.current
    if (rec != null && rec.rafId != null) cancelAnimationFrame(rec.rafId)
    scrollAnimRef.current = null
  }, [])

  const animateScrollTo = React.useCallback((sp: Element, targetTop: number, duration: number) => {
    cancelScrollAnim()
    const start = (sp as Element & { scrollTop: number }).scrollTop
    const delta = targetTop - start
    if (Math.abs(delta) < 0.5) {
      ;(sp as Element & { scrollTop: number }).scrollTop = targetTop
      return
    }
    const record: ScrollAnimRecord = { rafId: null }
    scrollAnimRef.current = record
    let startTime: number | null = null
    const step = (ts: number) => {
      if (scrollAnimRef.current !== record) return
      if (startTime === null) startTime = ts
      const t = Math.min(1, (ts - startTime) / duration)
      ;(sp as Element & { scrollTop: number }).scrollTop = start + delta * easeOutCubic(t)
      if (t < 1) record.rafId = requestAnimationFrame(step)
      else if (scrollAnimRef.current === record) scrollAnimRef.current = null
    }
    record.rafId = requestAnimationFrame(step)
  }, [cancelScrollAnim])

  const jumpToRow = React.useCallback((row: UserRow) => {
    const sp = scrollportRef.current
    if (!sp || !row.el) return
    const spEl = sp as Element & { scrollTop: number; scrollHeight: number; clientHeight: number }
    const spRect = sp.getBoundingClientRect()
    const rel = row.el.getBoundingClientRect().top - spRect.top
    const maxScroll = spEl.scrollHeight - spEl.clientHeight
    const targetTop = clamp(spEl.scrollTop + rel, 0, maxScroll)
    animateScrollTo(sp, targetTop, scrollMsRef.current)
  }, [animateScrollTo])

  // ── Main render loop (RAF) ───────────────────────────────────────────

  React.useEffect(() => {
    let rafId: number | null = null
    let observer: MutationObserver | null = null
    let stopped = false
    let sig = ''

    const clear = () => {
      userRowsRef.current = []
      setMarkers([])
      setActiveIndex(-1)
      activeIndexRef.current = -1
      navLockRef.current = null
      setBubbles({})
      setRailHidden(false)
    }

    const findScrollport = (): Element | null => {
      const cached = scrollportRef.current
      if (cached) {
        // Session switch can detach the old scrollport — re-resolve when needed.
        if (cached.isConnected) return cached
        scrollportRef.current = null
      }
      const next = document.querySelector('[data-conversation-scroll]')
      scrollportRef.current = next
      return next
    }

    let observedNode: Element | null = null
    const ensureObserver = (sp: Element | null) => {
      if (observer && observedNode === sp) return
      if (observer) { observer.disconnect(); observer = null }
      observedNode = sp
      if (sp) {
        observer = new MutationObserver(() => { sig = '' })
        observer.observe(sp, { childList: true, subtree: true, characterData: true })
      }
    }

    const computeBubbles = () => {
      const next: Record<number, BubblePos> = {}
      const refs = markerRefs.current
      for (let k = 0; k < refs.length; k++) {
        const el = refs[k]
        if (!el) continue
        const r = el.getBoundingClientRect()
        next[k] = { left: r.right + 8, top: r.top + r.height / 2 }
      }
      setBubbles(next)
    }

    const paint = () => {
      const sp = findScrollport()
      if (!sp || !sp.isConnected) { clear(); return }
      const spRect = sp.getBoundingClientRect()
      if (spRect.width <= 0 || spRect.height <= 0) { clear(); return }

      const rows = collectUserRows(sp)
      userRowsRef.current = rows
      if (rows.length === 0) { clear(); return }

      const spEl = sp as Element & { scrollTop: number; scrollHeight: number; clientHeight: number }
      const composer = sp.querySelector('[data-composer-seat]')
      const viewportBottom = composer
        ? Math.min(spRect.bottom, composer.getBoundingClientRect().top)
        : spRect.bottom
      const viewportHeight = Math.max(0, viewportBottom - spRect.top)

      // 窄屏检测：内容列左边缘一旦侵入 rail 所在区域，就视觉隐藏 rail；
      // 但 userRows / activeIndex 仍在下方照常维护，Alt+↑/↓ 键盘跳转不受影响。
      const flowColumn = sp.querySelector('[data-chat-flow]')
      const flowLeft = flowColumn ? flowColumn.getBoundingClientRect().left : null
      const overlapsRail =
        flowLeft != null && flowLeft < spRect.left + RAIL_LEFT_OFFSET + RAIL_WIDTH
      setRailHidden(overlapsRail)

      const layout = computeRailLayout({
        count: rows.length,
        viewportHeight,
        barH: MARKER_HEIGHT,
      })

      const atBottom = spEl.scrollTop + spEl.clientHeight >= spEl.scrollHeight - 24
      const rowTops: number[] = []
      for (let i = 0; i < rows.length; i++) {
        rowTops.push(rows[i].el.getBoundingClientRect().top - spRect.top)
      }
      let active = deriveActiveIndex({
        count: rows.length,
        rowTops,
        viewportHeight,
        threshold: ACTIVE_LINE_RATIO,
        atBottom,
      })

      // Hold the clicked/jumped-to marker briefly so smooth-scroll doesn't flicker it back.
      const nav = navLockRef.current
      if (nav != null && Date.now() < nav.until) {
        active = clamp(nav.index, 0, rows.length - 1)
      } else if (nav != null) {
        navLockRef.current = null
      }

      const newMarkers: Marker[] = []
      for (let j = 0; j < rows.length; j++) {
        newMarkers.push({ preview: normalizePreview(rows[j].preview), index: j })
      }
      setMarkers(newMarkers)
      setActiveIndex(active)
      activeIndexRef.current = active
      setRail({
        left: spRect.left + layout.leftOffset,
        top: spRect.top + layout.topOffset,
        height: layout.railHeight,
        gap: layout.gap,
      })
      computeBubbles()
    }

    const loop = () => {
      if (stopped) return
      rafId = requestAnimationFrame(loop)
      const sp = findScrollport()
      ensureObserver(sp)
      if (!sp) { sig = ''; clear(); return }
      const r = sp.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) { sig = ''; clear(); return }
      const spEl = sp as Element & { scrollTop: number; scrollHeight: number; clientHeight: number }
      const composer = sp.querySelector('[data-composer-seat]')
      const vb = composer
        ? Math.min(r.bottom, composer.getBoundingClientRect().top)
        : r.bottom
      const count = sp.querySelectorAll('[data-chat-flow-kind="user"]').length
      const key =
        (r.left | 0) + '|' +
        (r.top | 0) + '|' +
        (r.width | 0) + '|' +
        (vb | 0) + '|' +
        (spEl.scrollTop | 0) + '|' +
        count
      if (key !== sig) { sig = key; paint() }
    }

    rafId = requestAnimationFrame(loop)
    const bubbleUpdater = () => computeBubbles()
    window.addEventListener('scroll', bubbleUpdater, true)

    return () => {
      stopped = true
      if (rafId != null) cancelAnimationFrame(rafId)
      if (observer) observer.disconnect()
      window.removeEventListener('scroll', bubbleUpdater, true)
    }
  }, [])

  // ── Scrub (press-and-drag on rail like a scrollbar) ──────────────────

  React.useEffect(() => {
    const scrubTo = (clientY: number) => {
      const sp = scrollportRef.current
      const railEl = railRef.current
      if (!sp || !railEl) return
      const railRect = railEl.getBoundingClientRect()
      if (railRect.height <= 0) return
      cancelScrollAnim()
      const spEl = sp as Element & { scrollTop: number; scrollHeight: number; clientHeight: number }
      let f = (clientY - railRect.top) / railRect.height
      f = f < 0 ? 0 : f > 1 ? 1 : f
      const maxScroll = spEl.scrollHeight - spEl.clientHeight
      if (maxScroll > 0) spEl.scrollTop = f * maxScroll
    }

    const onMove = (e: MouseEvent) => {
      const s = scrubRef.current
      if (!s.active) return
      if (!s.moved && Math.abs(e.clientY - s.startY) > SCRUB_THRESHOLD_PX) {
        s.moved = true
        setScrubbing(true)
      }
      if (s.moved) scrubTo(e.clientY)
    }
    const onUp = () => {
      scrubRef.current.active = false
      setScrubbing(false)
    }
    const onWheel = () => { cancelScrollAnim() }
    const onTouchStart = () => { cancelScrollAnim() }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
    }
  }, [cancelScrollAnim])

  const handleRailMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    scrubRef.current = { active: true, moved: false, startY: e.clientY }
    cancelScrollAnim()
    e.preventDefault()
  }, [cancelScrollAnim])

  const handleClick = React.useCallback((index: number) => {
    if (scrubRef.current.moved) return // drag just happened — suppress click-jump
    const row = userRowsRef.current[index]
    if (row && row.el) {
      activateMarker(index)
      jumpToRow(row)
    }
  }, [activateMarker, jumpToRow])

  // ── Keyboard shortcuts (capture phase so editors can't swallow Alt) ──

  React.useEffect(() => {
    const isArrowUp = (e: KeyboardEvent) => e.key === 'ArrowUp' || e.key === 'Up' || e.code === 'ArrowUp'
    const isArrowDown = (e: KeyboardEvent) => e.key === 'ArrowDown' || e.key === 'Down' || e.code === 'ArrowDown'

    const onKey = (e: KeyboardEvent) => {
      if (!configRef.current.keyboardEnabled) return
      if (!e.altKey || e.ctrlKey || e.metaKey) return
      if (!isArrowUp(e) && !isArrowDown(e)) return

      const rows = userRowsRef.current
      if (!rows || rows.length === 0) return

      e.preventDefault()
      e.stopPropagation()

      const cur = activeIndexRef.current
      const curClamped = cur < 0 ? 0 : Math.min(cur, rows.length - 1)
      let target: number
      if (e.shiftKey) {
        target = isArrowUp(e) ? 0 : rows.length - 1
      } else {
        target = isArrowUp(e)
          ? Math.max(0, curClamped - 1)
          : Math.min(rows.length - 1, curClamped + 1)
      }
      const row = rows[target]
      if (row && row.el) {
        activateMarker(target)
        jumpToRow(row)
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('keydown', onKey, true) }
  }, [activateMarker, jumpToRow])

  // ── Render ────────────────────────────────────────────────────────────

  if (!config.railEnabled || railHidden || markers.length === 0) return null

  return React.createElement(
    'div',
    {
      className: 'dsh-msg-rail' + (scrubbing ? ' scrubbing' : ''),
      ref: railRef,
      onMouseDown: handleRailMouseDown,
      style: {
        left: rail.left + 'px',
        top: rail.top + 'px',
        height: rail.height + 'px',
        gap: rail.gap + 'px',
      },
    },
    markers.map((m, i) => {
      const pos = bubbles[m.index]
      const cls = 'dsh-msg-marker' + (i === activeIndex ? ' active' : '')
      return React.createElement(
        'div',
        {
          key: m.index,
          ref: setMarkerRef(m.index),
          className: cls,
          onClick: () => handleClick(m.index),
        },
        React.createElement('i'),
        pos && config.bubbleEnabled ? React.createElement(
          'div',
          {
            className: 'dsh-msg-bubble-wrap',
            style: { left: pos.left + 'px', top: pos.top + 'px' },
          },
          React.createElement('div', { className: 'dsh-msg-bubble' }, m.preview),
        ) : null,
      )
    }),
  )
}

// ── Plugin entry ─────────────────────────────────────────────────────────

export const name = PLUGIN_ID
export const inject: readonly string[] = ['slots', 'settingsScope']

export function apply(ctx: ClientCtx): void {
  injectStyle()
  const scope = ctx.settingsScope?.bind<NavPointerConfig>({ namespace: SETTINGS_NAMESPACE })

  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      { name: 'shell.overlay', id: 'message-pointer-rail', inject: () => ({ scope }) },
      MessagePointerRail,
    ),
  )

  if (scope) {
    ctx.slots.inject('settings.section', () =>
      ctx.slots.register(
        {
          name: 'settings.section',
          id: 'dsh-nav-pointer',
          order: 200,
          label: () => '消息指针',
          inject: () => ({ scope }),
        },
        SettingsSection,
      ),
    )
  }

  ctx.effect(() => {
    return () => { removeStyle() }
  }, 'dsh-nav-pointer: style cleanup')
}