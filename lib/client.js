window.__ModuleLoader__.load({
  id: "dsh-nav-pointer",
  factory: function (require) {
    "use strict";
    var React = require("react");
    var createElement = React.createElement;

    // ──────────────────────────────────────────────────────────────────────────
    // CSS
    // ──────────────────────────────────────────────────────────────────────────
    // Duration (ms) of the click / keyboard jump animation. The browser's
    // native `scrollIntoView({ behavior: "smooth" })` uses a distance-based
    // duration that feels slow on long conversations; a fixed duration keeps
    // every jump equally fast. Override at runtime with:
    //   window.__DSH_NAV_POINTER_SCROLL_MS__ = 160;
    // (set before the page loads the plugin, or then trigger a jump).
    var SCROLL_DURATION_MS =
      typeof window !== "undefined" && typeof window.__DSH_NAV_POINTER_SCROLL_MS__ === "number"
        ? window.__DSH_NAV_POINTER_SCROLL_MS__
        : 260;

    var STYLE_ID = "dsh-nav-pointer-style";
    var CSS = [
      ".dsh-msg-rail{position:fixed;width:36px;z-index:100;pointer-events:none;display:flex;flex-direction:column;align-items:flex-start}",
      ".dsh-msg-marker{pointer-events:auto;width:36px;height:16px;cursor:pointer;display:flex;align-items:center;flex:none;border-radius:4px;position:relative}",
      ".dsh-msg-marker > i{display:block;height:4px;border-radius:2px;background:var(--dsw-alias-label-tertiary);width:24px;transition:width .15s ease,background .15s ease}",
      ".dsh-msg-marker:hover > i{background:var(--dsw-alias-label-secondary);width:32px}",
      ".dsh-msg-marker.active > i{background:var(--dsw-static-deepseek-500);width:32px}",
      ".dsh-msg-bubble-wrap{position:fixed;transform:translateY(-50%);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease .3s;z-index:20}",
      ".dsh-msg-marker:hover .dsh-msg-bubble-wrap{opacity:1;visibility:visible;transition-delay:150ms}",
      ".dsh-msg-bubble{position:relative;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 85%,var(--dsw-alias-label-tertiary) 15%);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:6px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);width:240px;max-height:90px;overflow:hidden;white-space:normal;word-break:break-word;box-shadow:0 3px 10px rgba(0,0,0,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);text-overflow:ellipsis}",
      ".dsh-msg-bubble::before{content:\"\";position:absolute;left:-5px;top:50%;transform:translateY(-50%) rotate(-45deg);width:8px;height:8px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 85%,var(--dsw-alias-label-tertiary) 15%);border-left:1px solid var(--dsw-alias-border-l1);border-bottom:1px solid var(--dsw-alias-border-l1)}",
      ".dsh-msg-rail.scrubbing .dsh-msg-marker{cursor:grabbing}"
    ].join("\n");

    function injectStyle() {
      if (typeof document === "undefined") return;
      if (document.getElementById(STYLE_ID) !== null) return;
      var tag = document.createElement("style");
      tag.id = STYLE_ID;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    function removeStyle() {
      if (typeof document === "undefined") return;
      var el = document.getElementById(STYLE_ID);
      if (el) el.remove();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────
    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
    function truncate(s, n) { return s.length <= n ? s : s.slice(0, n - 1) + "…"; }
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    // ──────────────────────────────────────────────────────────────────────────
    // Component
    // ──────────────────────────────────────────────────────────────────────────
    function MessagePointerRail() {
      var useState = React.useState;
      var useEffect = React.useEffect;
      var useRef = React.useRef;

      var _m = useState([]), markers = _m[0], setMarkers = _m[1];
      var _a = useState(-1), activeIndex = _a[0], setActiveIndex = _a[1];
      var _r = useState({ left: 0, top: 0, height: 0, gap: 1 });
      var rail = _r[0], setRail = _r[1];
      var _b = useState({}), bubbles = _b[0], setBubbles = _b[1];
      var _s = useState(false), scrubbing = _s[0], setScrubbing = _s[1];

      var scrollportRef = useRef(null);
      var userRowsRef = useRef([]);
      var markerRefs = useRef([]);
      var railRef = useRef(null);
      var scrubRef = useRef({ active: false, moved: false, startY: 0 });
      var activeIndexRef = useRef(-1);
      var navLockRef = useRef(null); // { index, until } — user-initiated jump holds the active marker briefly
      var scrollAnimRef = useRef(null); // { rafId } — in-flight programmatic scroll

      function setMarkerRef(i) {
        return function (el) { markerRefs.current[i] = el; };
      }

      // Explicitly activate a marker (on click / keyboard jump). Sets the
      // highlight immediately and installs a short lock so the per-frame
      // scroll-tracking paint() doesn't flicker the marker back to the
      // pre-scroll position while smooth scrolling is in flight. When the
      // target message is already fully in view (e.g. two user messages fit
      // on screen and scrollIntoView moves nothing), paint() won't re-run
      // either, so this optimistic highlight persists and the color changes.
      function activateMarker(index) {
        setActiveIndex(index);
        activeIndexRef.current = index;
        navLockRef.current = { index: index, until: Date.now() + 600 };
      }

      // Cancel any in-flight programmatic scroll animation. Called before a new
      // jump and immediately on wheel/touch input so the user can interrupt it.
      function cancelScrollAnim() {
        var rec = scrollAnimRef.current;
        if (rec != null && rec.rafId != null) cancelAnimationFrame(rec.rafId);
        scrollAnimRef.current = null;
      }

      // Fixed-duration eased scroll, replacing `scrollIntoView({ smooth })`.
      // Cancels the previous animation, then drives scrollTop through RAF so
      // every jump (short or long) takes the same SCROLL_DURATION_MS.
      function animateScrollTo(sp, targetTop, duration) {
        cancelScrollAnim();
        var start = sp.scrollTop;
        var delta = targetTop - start;
        if (Math.abs(delta) < 0.5) { sp.scrollTop = targetTop; return; }
        var record = { rafId: null };
        scrollAnimRef.current = record;
        var startTime = null;
        function step(ts) {
          if (scrollAnimRef.current !== record) return; // superseded by a newer jump / user input
          if (startTime === null) startTime = ts;
          var t = Math.min(1, (ts - startTime) / duration);
          sp.scrollTop = start + delta * easeOutCubic(t);
          if (t < 1) record.rafId = requestAnimationFrame(step);
          else if (scrollAnimRef.current === record) scrollAnimRef.current = null;
        }
        record.rafId = requestAnimationFrame(step);
      }

      // Jump the scrollport so `row`'s top aligns to the viewport top
      // (equivalent to the previous `scrollIntoView({ block: "start" })`).
      function jumpToRow(row) {
        var sp = scrollportRef.current;
        if (!sp || !row || !row.el) return;
        var spRect = sp.getBoundingClientRect();
        var rel = row.el.getBoundingClientRect().top - spRect.top;
        var maxScroll = sp.scrollHeight - sp.clientHeight;
        var targetTop = clamp(sp.scrollTop + rel, 0, maxScroll);
        animateScrollTo(sp, targetTop, SCROLL_DURATION_MS);
      }

      useEffect(function () {
        var rafId = null;
        var observer = null;
        var observedNode = null;
        var sig = "";
        var stopped = false;
        var showing = false;

        function clear() {
          if (!showing) return;
          showing = false;
          userRowsRef.current = [];
          setMarkers([]);
          setActiveIndex(-1);
          activeIndexRef.current = -1;
          navLockRef.current = null;
          setBubbles({});
        }

        function findScrollport() {
          var cached = scrollportRef.current;
          if (cached) {
            // Switching sessions can unmount the old scroll container and mount
            // a new one. A detached node reports all-zero geometry, which used
            // to paint the rail at the screen's top-left corner. Re-resolve when
            // the cached node is no longer attached to the document.
            if (cached.isConnected) return cached;
            scrollportRef.current = null;
          }
          scrollportRef.current = document.querySelector("[data-conversation-scroll]");
          return scrollportRef.current;
        }

        function ensureObserver(sp) {
          if (sp === observedNode) return;
          if (observer) { observer.disconnect(); observer = null; }
          observedNode = sp;
          if (sp) {
            observer = new MutationObserver(function () { sig = ""; });
            observer.observe(sp, { childList: true, subtree: true, characterData: true });
          }
        }

        function collectUserRows() {
          var sp = scrollportRef.current;
          if (!sp) return [];
          var nodes = sp.querySelectorAll('[data-chat-flow-kind="user"]');
          var out = [];
          for (var k = 0; k < nodes.length; k++) {
            var el = nodes[k];
            var text = el.textContent || "";
            out.push({
              el: el,
              preview: text.slice(0, 200).trim()
            });
          }
          return out;
        }

        function computeBubbles() {
          var next = {};
          var refs = markerRefs.current;
          for (var k = 0; k < refs.length; k++) {
            var el = refs[k];
            if (!el) continue;
            var r = el.getBoundingClientRect();
            next[k] = { left: r.right + 8, top: r.top + r.height / 2 };
          }
          setBubbles(next);
        }

        function paint() {
          var sp = scrollportRef.current;
          if (!sp || !sp.isConnected) { clear(); return; }
          var spRect = sp.getBoundingClientRect();
          if (spRect.width <= 0 || spRect.height <= 0) { clear(); return; }
          var rows = collectUserRows();
          userRowsRef.current = rows;
          if (rows.length === 0) { clear(); return; }
          var scrollTop = sp.scrollTop;
          var scrollHeight = sp.scrollHeight;
          var clientHeight = sp.clientHeight;
          var composer = sp.querySelector("[data-composer-seat]");
          var viewportBottom = composer
            ? Math.min(spRect.bottom, composer.getBoundingClientRect().top)
            : spRect.bottom;
          var viewportHeight = Math.max(0, viewportBottom - spRect.top);

          var barH = 16;
          var gap = 1;
          var railHeight = rows.length * barH + (rows.length - 1) * gap;
          if (railHeight > viewportHeight && rows.length > 1) {
            gap = Math.max(0, (viewportHeight - rows.length * barH) / (rows.length - 1));
            railHeight = viewportHeight;
          }
          var top = spRect.top + clamp(
            (viewportHeight - railHeight) / 2,
            0,
            Math.max(0, viewportHeight - railHeight)
          );
          var left = spRect.left + 16;

          var atBottom = scrollTop + clientHeight >= scrollHeight - 24;
          var active = 0;
          if (atBottom) {
            active = rows.length - 1;
          } else {
            for (var i = 0; i < rows.length; i++) {
              var rel = rows[i].el.getBoundingClientRect().top - spRect.top;
              if (rel <= viewportHeight * 0.35) active = i;
              else break;
            }
          }

          // A user-initiated jump (click / keyboard) sets the highlight
          // immediately. Hold it through the smooth scroll so the scroll-derived
          // position above can't immediately snap it back to the pre-jump marker.
          var nav = navLockRef.current;
          if (nav != null && Date.now() < nav.until) {
            active = clamp(nav.index, 0, rows.length - 1);
          } else if (nav != null) {
            navLockRef.current = null;
          }

          var newMarkers = [];
          for (var j = 0; j < rows.length; j++) {
            newMarkers.push({
              preview: truncate(rows[j].preview.replace(/\s+/g, " "), 100),
              index: j
            });
          }
          setMarkers(newMarkers);
          setActiveIndex(active);
          activeIndexRef.current = active;
          setRail({ left: left, top: top, height: railHeight, gap: gap });
          computeBubbles();
          showing = true;
        }

        function loop() {
          if (stopped) return;
          rafId = requestAnimationFrame(loop);
          var sp = findScrollport();
          ensureObserver(sp);
          if (!sp) { sig = ""; clear(); return; }
          var r = sp.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) { clear(); return; }
          var composer = sp.querySelector("[data-composer-seat]");
          var vb = composer
            ? Math.min(r.bottom, composer.getBoundingClientRect().top)
            : r.bottom;
          var count = sp.querySelectorAll('[data-chat-flow-kind="user"]').length;
          var key = (r.left | 0) + "|" + (r.top | 0) + "|" + (r.width | 0) + "|"
            + (vb | 0) + "|" + (sp.scrollTop | 0) + "|" + count;
          if (key !== sig) { sig = key; paint(); }
        }

        rafId = requestAnimationFrame(loop);
        window.addEventListener("scroll", computeBubbles, true);

        return function () {
          stopped = true;
          if (rafId) cancelAnimationFrame(rafId);
          if (observer) observer.disconnect();
          window.removeEventListener("scroll", computeBubbles, true);
        };
      }, []);

      // Scrub: press and drag along the rail to scrub through the conversation
      // like a scrollbar. A click (no movement) keeps the existing precise
      // marker jump; any drag past the 3px threshold maps the pointer's Y
      // position onto the scrollport's scrollTop.
      useEffect(function () {
        function onMove(e) {
          var s = scrubRef.current;
          if (!s.active) return;
          if (!s.moved && Math.abs(e.clientY - s.startY) > 3) {
            s.moved = true;
            setScrubbing(true);
          }
          if (s.moved) scrubTo(e.clientY);
        }
        function onUp() {
          scrubRef.current.active = false;
          setScrubbing(false);
        }
        // User wheel/touch input interrupts any programmatic click-jump so the
        // animation never fights the user's own scrolling.
        function onWheel() { cancelScrollAnim(); }
        function onTouchStart() { cancelScrollAnim(); }
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("wheel", onWheel, { passive: true });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        return function () {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          window.removeEventListener("wheel", onWheel);
          window.removeEventListener("touchstart", onTouchStart);
        };
      }, []);

      function scrubTo(clientY) {
        var sp = scrollportRef.current;
        var railEl = railRef.current;
        if (!sp || !railEl) return;
        var railRect = railEl.getBoundingClientRect();
        if (railRect.height <= 0) return;
        cancelScrollAnim(); // dragging cancels any in-flight click-jump animation
        var f = (clientY - railRect.top) / railRect.height;
        f = f < 0 ? 0 : (f > 1 ? 1 : f);
        var maxScroll = sp.scrollHeight - sp.clientHeight;
        if (maxScroll > 0) sp.scrollTop = f * maxScroll;
      }

      function handleRailMouseDown(e) {
        if (e.button !== 0) return;
        scrubRef.current = { active: true, moved: false, startY: e.clientY };
        cancelScrollAnim(); // a press/drag starts; cancel any click-jump in flight
        e.preventDefault();
      }

      function handleClick(index) {
        if (scrubRef.current.moved) return; // a drag just happened; skip the click jump
        var row = userRowsRef.current[index];
        if (row && row.el) {
          activateMarker(index);
          jumpToRow(row);
        }
      }

      // Keyboard shortcuts: Alt+↑/↓ to jump between user messages,
      // Alt+Shift+↑/↓ to jump to first/last message.
      // Attached on document in capture phase so that rich-text editors
      // (Slate/ProseMirror in the composer) and other React handlers that
      // stopPropagation on bubble can't swallow the event before we see it.
      useEffect(function () {
        function isArrowUp(e) {
          return e.key === "ArrowUp" || e.key === "Up" || e.code === "ArrowUp";
        }
        function isArrowDown(e) {
          return e.key === "ArrowDown" || e.key === "Down" || e.code === "ArrowDown";
        }
        function onKey(e) {
          // Require Alt (Option on mac), forbid Ctrl/Meta so we don't
          // collide with browser/OS shortcuts.
          if (!e.altKey || e.ctrlKey || e.metaKey) return;
          if (!isArrowUp(e) && !isArrowDown(e)) return;

          var rows = userRowsRef.current;
          if (!rows || rows.length === 0) return;

          // Prevent default *before* anything else so the browser menu bar,
          // IME candidate navigation, and editor handlers don't eat the combo.
          e.preventDefault();
          e.stopPropagation();

          var cur = activeIndexRef.current;
          var curClamped = cur < 0 ? 0 : Math.min(cur, rows.length - 1);
          var target;
          if (e.shiftKey) {
            target = isArrowUp(e) ? 0 : rows.length - 1;
          } else {
            target = isArrowUp(e)
              ? Math.max(0, curClamped - 1)
              : Math.min(rows.length - 1, curClamped + 1);
          }
          var row = rows[target];
          if (row && row.el) {
            activateMarker(target);
            jumpToRow(row);
          }
        }
        document.addEventListener("keydown", onKey, true);
        return function () {
          document.removeEventListener("keydown", onKey, true);
        };
      }, []);

      if (markers.length === 0) return null;

      return createElement(
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
        markers.map(function (m, i) {
          var pos = bubbles[m.index];
          var cls = "dsh-msg-marker"
            + (i === activeIndex ? " active" : "");
          return createElement(
            "div",
            {
              key: m.index,
              ref: setMarkerRef(m.index),
              className: cls,
              onClick: function () { handleClick(m.index); }
            },
            createElement("i"),
            pos && createElement(
              "div",
              {
                className: "dsh-msg-bubble-wrap",
                style: { left: pos.left + "px", top: pos.top + "px" }
              },
              createElement("div", { className: "dsh-msg-bubble" }, m.preview)
            )
          );
        })
      );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Plugin entry
    // ──────────────────────────────────────────────────────────────────────────
    var name = "dsh-nav-pointer";
    var inject = ["slots"];

    function apply(ctx) {
      injectStyle();
      ctx.slots.inject("shell.overlay", function () {
        return ctx.slots.register(
          { name: "shell.overlay", id: "message-pointer-rail" },
          MessagePointerRail
        );
      });
      ctx.effect(function () {
        return function () { removeStyle(); };
      }, "dsh-nav-pointer: style cleanup");
    }

    return { name: name, inject: inject, apply: apply };
  }
});
