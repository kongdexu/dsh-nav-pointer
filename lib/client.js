window.__ModuleLoader__.load({id:"dsh-nav-pointer",factory:function(require){
"use strict";
var __dshnavBundle = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name2 in all)
      __defProp(target, name2, { get: all[name2], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/client.ts
  var client_exports = {};
  __export(client_exports, {
    apply: () => apply,
    inject: () => inject,
    name: () => name
  });
  var React = __toESM(__require("react"), 1);

  // src/core.ts
  var PLUGIN_ID = "dsh-nav-pointer";
  var STYLE_ID = "dsh-nav-pointer-style";
  var WINDOW_SCROLL_MS_OVERRIDE = typeof window !== "undefined" && typeof window.__DSH_NAV_POINTER_SCROLL_MS__ === "number" ? window.__DSH_NAV_POINTER_SCROLL_MS__ : void 0;
  var MARKER_HEIGHT = 16;
  var MARKER_GAP_DEFAULT = 1;
  var ACTIVE_LINE_RATIO = 0.35;
  var NAV_LOCK_MS = 600;
  var SCRUB_THRESHOLD_PX = 3;
  var PREVIEW_RAW_SLICE = 200;
  var PREVIEW_MARKER_CHARS = 100;
  var CSS = [
    ".dsh-msg-rail{position:fixed;width:36px;z-index:100;pointer-events:none;display:flex;flex-direction:column;align-items:flex-start}",
    ".dsh-msg-marker{pointer-events:auto;width:36px;height:16px;cursor:pointer;display:flex;align-items:center;flex:none;border-radius:4px;position:relative}",
    ".dsh-msg-marker > i{display:block;height:4px;border-radius:2px;background:var(--dsw-alias-label-tertiary);width:24px;transition:width .15s ease,background .15s ease}",
    ".dsh-msg-marker:hover > i{background:var(--dsw-alias-label-secondary);width:32px}",
    ".dsh-msg-marker.active > i{background:var(--dsw-static-deepseek-500);width:32px}",
    ".dsh-msg-bubble-wrap{position:fixed;transform:translateY(-50%);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease .3s;z-index:20}",
    ".dsh-msg-marker:hover .dsh-msg-bubble-wrap{opacity:1;visibility:visible;transition-delay:150ms}",
    ".dsh-msg-bubble{position:relative;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 85%,var(--dsw-alias-label-tertiary) 15%);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:6px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);width:240px;max-height:90px;overflow:hidden;white-space:normal;word-break:break-word;box-shadow:0 3px 10px rgba(0,0,0,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);text-overflow:ellipsis}",
    '.dsh-msg-bubble::before{content:"";position:absolute;left:-5px;top:50%;transform:translateY(-50%) rotate(-45deg);width:8px;height:8px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 85%,var(--dsw-alias-label-tertiary) 15%);border-left:1px solid var(--dsw-alias-border-l1);border-bottom:1px solid var(--dsw-alias-border-l1)}',
    ".dsh-msg-rail.scrubbing .dsh-msg-marker{cursor:grabbing}",
    ".dsh-msg-settings{display:flex;flex-direction:column;max-width:540px}",
    ".dsh-msg-settings-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--dsw-alias-border-l2)}",
    ".dsh-msg-settings-row:last-child{border-bottom:none}",
    ".dsh-msg-settings-text{display:flex;flex-direction:column;gap:2px;min-width:0}",
    ".dsh-msg-settings-label{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}",
    ".dsh-msg-settings-hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.4}",
    ".dsh-msg-settings-num{width:96px;flex:none;padding:6px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit}",
    ".dsh-msg-settings-check{flex:none;width:16px;height:16px;accent-color:var(--dsw-static-deepseek-500)}"
  ].join("\n");
  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function truncate(s, n) {
    return s.length <= n ? s : s.slice(0, n - 1) + "\u2026";
  }
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  function normalizePreview(raw) {
    return truncate(raw.replace(/\s+/g, " "), PREVIEW_MARKER_CHARS);
  }
  function injectStyle() {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID) !== null) return;
    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }
  function removeStyle() {
    if (typeof document === "undefined") return;
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  }
  function collectUserRows(scrollport) {
    if (!scrollport) return [];
    const nodes = scrollport.querySelectorAll('[data-chat-flow-kind="user"]');
    const out = [];
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const text = (el.textContent || "").slice(0, PREVIEW_RAW_SLICE).trim();
      out.push({ el, preview: text });
    }
    return out;
  }
  function computeRailLayout(opts) {
    const barH = opts.barH ?? MARKER_HEIGHT;
    const defaultGap = opts.defaultGap ?? MARKER_GAP_DEFAULT;
    const count = Math.max(0, opts.count | 0);
    let gap = defaultGap;
    let railHeight = count * barH + Math.max(0, count - 1) * gap;
    if (count > 1 && railHeight > opts.viewportHeight) {
      gap = Math.max(0, (opts.viewportHeight - count * barH) / (count - 1));
      railHeight = opts.viewportHeight;
    }
    const topOffset = clamp(
      (opts.viewportHeight - railHeight) / 2,
      0,
      Math.max(0, opts.viewportHeight - railHeight)
    );
    return { gap, railHeight, topOffset, leftOffset: 16 };
  }
  function deriveActiveIndex(opts) {
    const threshold = opts.threshold ?? ACTIVE_LINE_RATIO;
    if (opts.count === 0) return -1;
    if (opts.atBottom) return opts.count - 1;
    let active = 0;
    const line = opts.viewportHeight * threshold;
    for (let i = 0; i < opts.count; i++) {
      if (opts.rowTops[i] <= line) active = i;
      else break;
    }
    return active;
  }

  // src/config.ts
  var SETTINGS_NAMESPACE = "dsh-nav-pointer";
  var DEFAULT_CONFIG = {
    scrollMs: 260,
    railEnabled: true,
    bubbleEnabled: true,
    keyboardEnabled: true
  };

  // src/client.ts
  function useNavPointerConfig(scope) {
    const [config, setConfig] = React.useState(
      () => scope?.getSnapshot().value ?? DEFAULT_CONFIG
    );
    React.useEffect(() => {
      if (!scope) return;
      const refresh = () => setConfig(scope.getSnapshot().value ?? DEFAULT_CONFIG);
      refresh();
      return scope.subscribe(refresh);
    }, [scope]);
    return config;
  }
  function SettingsSection(props) {
    const scope = props.scope;
    const config = useNavPointerConfig(scope);
    const write = (field, value) => {
      if (!scope) return;
      scope.set(field, value).catch(() => {
      });
    };
    const numberRow = (label, hint, value, onCommit) => React.createElement(
      "div",
      { className: "dsh-msg-settings-row" },
      React.createElement(
        "div",
        { className: "dsh-msg-settings-text" },
        React.createElement("div", { className: "dsh-msg-settings-label" }, label),
        React.createElement("div", { className: "dsh-msg-settings-hint" }, hint)
      ),
      React.createElement("input", {
        className: "dsh-msg-settings-num",
        type: "number",
        min: 60,
        max: 2e3,
        value,
        onChange: (e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onCommit(Math.min(2e3, Math.max(60, Math.round(n))));
        }
      })
    );
    const toggleRow = (label, hint, value, onToggle) => React.createElement(
      "div",
      { className: "dsh-msg-settings-row" },
      React.createElement(
        "div",
        { className: "dsh-msg-settings-text" },
        React.createElement("div", { className: "dsh-msg-settings-label" }, label),
        React.createElement("div", { className: "dsh-msg-settings-hint" }, hint)
      ),
      React.createElement("input", {
        className: "dsh-msg-settings-check",
        type: "checkbox",
        checked: value,
        onChange: (e) => onToggle(e.target.checked)
      })
    );
    return React.createElement(
      "div",
      { className: "dsh-msg-settings" },
      numberRow("\u6EDA\u52A8\u65F6\u957F", "\u70B9\u51FB / \u952E\u76D8\u8DF3\u8F6C\u52A8\u753B\u65F6\u957F\uFF08\u6BEB\u79D2\uFF09", config.scrollMs, (n) => write("scrollMs", n)),
      toggleRow("\u663E\u793A\u6307\u9488\u5BFC\u8F68", "\u5173\u95ED\u540E\u4E0D\u6E32\u67D3\u6D88\u606F\u6307\u9488\u5BFC\u8F68", config.railEnabled, (b) => write("railEnabled", b)),
      toggleRow("\u60AC\u505C\u9884\u89C8\u6C14\u6CE1", "\u9F20\u6807\u60AC\u505C\u6807\u8BB0\u65F6\u663E\u793A\u6D88\u606F\u9884\u89C8", config.bubbleEnabled, (b) => write("bubbleEnabled", b)),
      toggleRow("\u952E\u76D8\u8DF3\u8F6C", "Alt+\u2191/\u2193 \u5728\u7528\u6237\u6D88\u606F\u95F4\u8DF3\u8F6C", config.keyboardEnabled, (b) => write("keyboardEnabled", b))
    );
  }
  function MessagePointerRail(props) {
    const config = useNavPointerConfig(props.scope);
    const scrollMs = WINDOW_SCROLL_MS_OVERRIDE ?? config.scrollMs;
    const configRef = React.useRef(config);
    configRef.current = config;
    const scrollMsRef = React.useRef(scrollMs);
    scrollMsRef.current = scrollMs;
    const [markers, setMarkers] = React.useState([]);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const [rail, setRail] = React.useState({ left: 0, top: 0, height: 0, gap: 1 });
    const [bubbles, setBubbles] = React.useState({});
    const [scrubbing, setScrubbing] = React.useState(false);
    const scrollportRef = React.useRef(null);
    const userRowsRef = React.useRef([]);
    const markerRefs = React.useRef([]);
    const railRef = React.useRef(null);
    const scrubRef = React.useRef({ active: false, moved: false, startY: 0 });
    const activeIndexRef = React.useRef(-1);
    const navLockRef = React.useRef(null);
    const scrollAnimRef = React.useRef(null);
    const setMarkerRef = React.useCallback((i) => {
      return (el) => {
        markerRefs.current[i] = el;
      };
    }, []);
    const activateMarker = React.useCallback((index) => {
      setActiveIndex(index);
      activeIndexRef.current = index;
      navLockRef.current = { index, until: Date.now() + NAV_LOCK_MS };
    }, []);
    const cancelScrollAnim = React.useCallback(() => {
      const rec = scrollAnimRef.current;
      if (rec != null && rec.rafId != null) cancelAnimationFrame(rec.rafId);
      scrollAnimRef.current = null;
    }, []);
    const animateScrollTo = React.useCallback((sp, targetTop, duration) => {
      cancelScrollAnim();
      const start = sp.scrollTop;
      const delta = targetTop - start;
      if (Math.abs(delta) < 0.5) {
        ;
        sp.scrollTop = targetTop;
        return;
      }
      const record = { rafId: null };
      scrollAnimRef.current = record;
      let startTime = null;
      const step = (ts) => {
        if (scrollAnimRef.current !== record) return;
        if (startTime === null) startTime = ts;
        const t = Math.min(1, (ts - startTime) / duration);
        sp.scrollTop = start + delta * easeOutCubic(t);
        if (t < 1) record.rafId = requestAnimationFrame(step);
        else if (scrollAnimRef.current === record) scrollAnimRef.current = null;
      };
      record.rafId = requestAnimationFrame(step);
    }, [cancelScrollAnim]);
    const jumpToRow = React.useCallback((row) => {
      const sp = scrollportRef.current;
      if (!sp || !row.el) return;
      const spEl = sp;
      const spRect = sp.getBoundingClientRect();
      const rel = row.el.getBoundingClientRect().top - spRect.top;
      const maxScroll = spEl.scrollHeight - spEl.clientHeight;
      const targetTop = clamp(spEl.scrollTop + rel, 0, maxScroll);
      animateScrollTo(sp, targetTop, scrollMsRef.current);
    }, [animateScrollTo]);
    React.useEffect(() => {
      let rafId = null;
      let observer = null;
      let stopped = false;
      let sig = "";
      const clear = () => {
        userRowsRef.current = [];
        setMarkers([]);
        setActiveIndex(-1);
        activeIndexRef.current = -1;
        navLockRef.current = null;
        setBubbles({});
      };
      const findScrollport = () => {
        const cached = scrollportRef.current;
        if (cached) {
          if (cached.isConnected) return cached;
          scrollportRef.current = null;
        }
        const next = document.querySelector("[data-conversation-scroll]");
        scrollportRef.current = next;
        return next;
      };
      let observedNode = null;
      const ensureObserver = (sp) => {
        if (observer && observedNode === sp) return;
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        observedNode = sp;
        if (sp) {
          observer = new MutationObserver(() => {
            sig = "";
          });
          observer.observe(sp, { childList: true, subtree: true, characterData: true });
        }
      };
      const computeBubbles = () => {
        const next = {};
        const refs = markerRefs.current;
        for (let k = 0; k < refs.length; k++) {
          const el = refs[k];
          if (!el) continue;
          const r = el.getBoundingClientRect();
          next[k] = { left: r.right + 8, top: r.top + r.height / 2 };
        }
        setBubbles(next);
      };
      const paint = () => {
        const sp = findScrollport();
        if (!sp || !sp.isConnected) {
          clear();
          return;
        }
        const spRect = sp.getBoundingClientRect();
        if (spRect.width <= 0 || spRect.height <= 0) {
          clear();
          return;
        }
        const rows = collectUserRows(sp);
        userRowsRef.current = rows;
        if (rows.length === 0) {
          clear();
          return;
        }
        const spEl = sp;
        const composer = sp.querySelector("[data-composer-seat]");
        const viewportBottom = composer ? Math.min(spRect.bottom, composer.getBoundingClientRect().top) : spRect.bottom;
        const viewportHeight = Math.max(0, viewportBottom - spRect.top);
        const layout = computeRailLayout({
          count: rows.length,
          viewportHeight,
          barH: MARKER_HEIGHT
        });
        const atBottom = spEl.scrollTop + spEl.clientHeight >= spEl.scrollHeight - 24;
        const rowTops = [];
        for (let i = 0; i < rows.length; i++) {
          rowTops.push(rows[i].el.getBoundingClientRect().top - spRect.top);
        }
        let active = deriveActiveIndex({
          count: rows.length,
          rowTops,
          viewportHeight,
          threshold: ACTIVE_LINE_RATIO,
          atBottom
        });
        const nav = navLockRef.current;
        if (nav != null && Date.now() < nav.until) {
          active = clamp(nav.index, 0, rows.length - 1);
        } else if (nav != null) {
          navLockRef.current = null;
        }
        const newMarkers = [];
        for (let j = 0; j < rows.length; j++) {
          newMarkers.push({ preview: normalizePreview(rows[j].preview), index: j });
        }
        setMarkers(newMarkers);
        setActiveIndex(active);
        activeIndexRef.current = active;
        setRail({
          left: spRect.left + layout.leftOffset,
          top: spRect.top + layout.topOffset,
          height: layout.railHeight,
          gap: layout.gap
        });
        computeBubbles();
      };
      const loop = () => {
        if (stopped) return;
        rafId = requestAnimationFrame(loop);
        const sp = findScrollport();
        ensureObserver(sp);
        if (!sp) {
          sig = "";
          clear();
          return;
        }
        const r = sp.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) {
          sig = "";
          clear();
          return;
        }
        const spEl = sp;
        const composer = sp.querySelector("[data-composer-seat]");
        const vb = composer ? Math.min(r.bottom, composer.getBoundingClientRect().top) : r.bottom;
        const count = sp.querySelectorAll('[data-chat-flow-kind="user"]').length;
        const key = (r.left | 0) + "|" + (r.top | 0) + "|" + (r.width | 0) + "|" + (vb | 0) + "|" + (spEl.scrollTop | 0) + "|" + count;
        if (key !== sig) {
          sig = key;
          paint();
        }
      };
      rafId = requestAnimationFrame(loop);
      const bubbleUpdater = () => computeBubbles();
      window.addEventListener("scroll", bubbleUpdater, true);
      return () => {
        stopped = true;
        if (rafId != null) cancelAnimationFrame(rafId);
        if (observer) observer.disconnect();
        window.removeEventListener("scroll", bubbleUpdater, true);
      };
    }, []);
    React.useEffect(() => {
      const scrubTo = (clientY) => {
        const sp = scrollportRef.current;
        const railEl = railRef.current;
        if (!sp || !railEl) return;
        const railRect = railEl.getBoundingClientRect();
        if (railRect.height <= 0) return;
        cancelScrollAnim();
        const spEl = sp;
        let f = (clientY - railRect.top) / railRect.height;
        f = f < 0 ? 0 : f > 1 ? 1 : f;
        const maxScroll = spEl.scrollHeight - spEl.clientHeight;
        if (maxScroll > 0) spEl.scrollTop = f * maxScroll;
      };
      const onMove = (e) => {
        const s = scrubRef.current;
        if (!s.active) return;
        if (!s.moved && Math.abs(e.clientY - s.startY) > SCRUB_THRESHOLD_PX) {
          s.moved = true;
          setScrubbing(true);
        }
        if (s.moved) scrubTo(e.clientY);
      };
      const onUp = () => {
        scrubRef.current.active = false;
        setScrubbing(false);
      };
      const onWheel = () => {
        cancelScrollAnim();
      };
      const onTouchStart = () => {
        cancelScrollAnim();
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("wheel", onWheel, { passive: true });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      return () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchstart", onTouchStart);
      };
    }, [cancelScrollAnim]);
    const handleRailMouseDown = React.useCallback((e) => {
      if (e.button !== 0) return;
      scrubRef.current = { active: true, moved: false, startY: e.clientY };
      cancelScrollAnim();
      e.preventDefault();
    }, [cancelScrollAnim]);
    const handleClick = React.useCallback((index) => {
      if (scrubRef.current.moved) return;
      const row = userRowsRef.current[index];
      if (row && row.el) {
        activateMarker(index);
        jumpToRow(row);
      }
    }, [activateMarker, jumpToRow]);
    React.useEffect(() => {
      const isArrowUp = (e) => e.key === "ArrowUp" || e.key === "Up" || e.code === "ArrowUp";
      const isArrowDown = (e) => e.key === "ArrowDown" || e.key === "Down" || e.code === "ArrowDown";
      const onKey = (e) => {
        if (!configRef.current.keyboardEnabled) return;
        if (!e.altKey || e.ctrlKey || e.metaKey) return;
        if (!isArrowUp(e) && !isArrowDown(e)) return;
        const rows = userRowsRef.current;
        if (!rows || rows.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        const cur = activeIndexRef.current;
        const curClamped = cur < 0 ? 0 : Math.min(cur, rows.length - 1);
        let target;
        if (e.shiftKey) {
          target = isArrowUp(e) ? 0 : rows.length - 1;
        } else {
          target = isArrowUp(e) ? Math.max(0, curClamped - 1) : Math.min(rows.length - 1, curClamped + 1);
        }
        const row = rows[target];
        if (row && row.el) {
          activateMarker(target);
          jumpToRow(row);
        }
      };
      document.addEventListener("keydown", onKey, true);
      return () => {
        document.removeEventListener("keydown", onKey, true);
      };
    }, [activateMarker, jumpToRow]);
    if (!config.railEnabled) return null;
    if (markers.length === 0) return null;
    return React.createElement(
      "div",
      {
        className: "dsh-msg-rail" + (scrubbing ? " scrubbing" : ""),
        ref: railRef,
        onMouseDown: handleRailMouseDown,
        style: {
          left: rail.left + "px",
          top: rail.top + "px",
          height: rail.height + "px",
          gap: rail.gap + "px"
        }
      },
      markers.map((m, i) => {
        const pos = bubbles[m.index];
        const cls = "dsh-msg-marker" + (i === activeIndex ? " active" : "");
        return React.createElement(
          "div",
          {
            key: m.index,
            ref: setMarkerRef(m.index),
            className: cls,
            onClick: () => handleClick(m.index)
          },
          React.createElement("i"),
          pos && config.bubbleEnabled ? React.createElement(
            "div",
            {
              className: "dsh-msg-bubble-wrap",
              style: { left: pos.left + "px", top: pos.top + "px" }
            },
            React.createElement("div", { className: "dsh-msg-bubble" }, m.preview)
          ) : null
        );
      })
    );
  }
  var name = PLUGIN_ID;
  var inject = ["slots", "settingsScope"];
  function apply(ctx) {
    injectStyle();
    const scope = ctx.settingsScope?.bind({ namespace: SETTINGS_NAMESPACE });
    ctx.slots.inject(
      "shell.overlay",
      () => ctx.slots.register(
        { name: "shell.overlay", id: "message-pointer-rail", inject: () => ({ scope }) },
        MessagePointerRail
      )
    );
    if (scope) {
      ctx.slots.inject(
        "settings.section",
        () => ctx.slots.register(
          {
            name: "settings.section",
            id: "dsh-nav-pointer",
            order: 200,
            label: () => "\u6D88\u606F\u6307\u9488",
            inject: () => ({ scope })
          },
          SettingsSection
        )
      );
    }
    ctx.effect(() => {
      return () => {
        removeStyle();
      };
    }, "dsh-nav-pointer: style cleanup");
  }
  return __toCommonJS(client_exports);
})();
return __dshnavBundle;}});
