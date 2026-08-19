window.__ModuleLoader__.load({
  id: "dsh-message-pointer",
  factory: function (require) {
    "use strict";
    var React = require("react");
    var createElement = React.createElement;

    // ──────────────────────────────────────────────────────────────────────────
    // CSS
    // ──────────────────────────────────────────────────────────────────────────
    var STYLE_ID = "dsh-message-pointer-style";
    var CSS = [
      ".dsh-msg-rail{position:fixed;width:36px;z-index:100;pointer-events:none;display:flex;flex-direction:column;align-items:flex-start}",
      ".dsh-msg-marker{pointer-events:auto;width:36px;height:16px;cursor:pointer;display:flex;align-items:center;flex:none;border-radius:4px;position:relative}",
      ".dsh-msg-marker > i{display:block;height:4px;border-radius:2px;background:var(--dsw-alias-label-tertiary);width:24px;transition:width .15s ease,background .15s ease}",
      ".dsh-msg-marker:hover > i{background:var(--dsw-alias-label-secondary);width:32px}",
      ".dsh-msg-marker.active > i{background:var(--dsw-static-deepseek-500);width:32px}",
      ".dsh-msg-bubble-wrap{position:fixed;transform:translateY(-50%);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease .3s;z-index:20}",
      ".dsh-msg-marker:hover .dsh-msg-bubble-wrap{opacity:1;visibility:visible;transition-delay:150ms}",
      ".dsh-msg-bubble{position:relative;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 85%,var(--dsw-alias-label-tertiary) 15%);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:6px 10px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);width:240px;max-height:90px;overflow:hidden;white-space:normal;word-break:break-word;box-shadow:0 3px 10px rgba(0,0,0,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);text-overflow:ellipsis}",
      ".dsh-msg-bubble::before{content:\"\";position:absolute;left:-5px;top:50%;transform:translateY(-50%) rotate(-45deg);width:8px;height:8px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 85%,var(--dsw-alias-label-tertiary) 15%);border-left:1px solid var(--dsw-alias-border-l1);border-bottom:1px solid var(--dsw-alias-border-l1)}"
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

      var scrollportRef = useRef(null);
      var userRowsRef = useRef([]);
      var markerRefs = useRef([]);

      function setMarkerRef(i) {
        return function (el) { markerRefs.current[i] = el; };
      }

      useEffect(function () {
        var rafId = null;
        var observer = null;
        var sig = "";
        var stopped = false;

        function findScrollport() {
          if (!scrollportRef.current) {
            scrollportRef.current = document.querySelector("[data-conversation-scroll]");
          }
          return scrollportRef.current;
        }

        function collectUserRows() {
          var sp = scrollportRef.current;
          if (!sp) return [];
          var nodes = sp.querySelectorAll('[data-chat-flow-kind="user"]');
          var out = [];
          for (var k = 0; k < nodes.length; k++) {
            var el = nodes[k];
            var text = el.textContent || "";
            out.push({ el: el, preview: text.slice(0, 200).trim() });
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
          if (!sp) return;
          var rows = collectUserRows();
          userRowsRef.current = rows;
          if (rows.length === 0) {
            setMarkers([]);
            setActiveIndex(-1);
            return;
          }
          var spRect = sp.getBoundingClientRect();
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

          var newMarkers = [];
          for (var j = 0; j < rows.length; j++) {
            newMarkers.push({
              preview: truncate(rows[j].preview.replace(/\s+/g, " "), 100),
              index: j
            });
          }
          setMarkers(newMarkers);
          setActiveIndex(active);
          setRail({ left: left, top: top, height: railHeight, gap: gap });
          computeBubbles();
        }

        function loop() {
          if (stopped) return;
          rafId = requestAnimationFrame(loop);
          var sp = findScrollport();
          if (!sp) { sig = ""; return; }
          var r = sp.getBoundingClientRect();
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

        var spInit = findScrollport();
        if (spInit) {
          observer = new MutationObserver(function () { sig = ""; });
          observer.observe(spInit, { childList: true, subtree: true, characterData: true });
        }
        window.addEventListener("scroll", computeBubbles, true);

        return function () {
          stopped = true;
          if (rafId) cancelAnimationFrame(rafId);
          if (observer) observer.disconnect();
          window.removeEventListener("scroll", computeBubbles, true);
        };
      }, []);

      function handleClick(index) {
        var row = userRowsRef.current[index];
        if (row && row.el) {
          row.el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }

      if (markers.length === 0) return null;

      return createElement(
        "div",
        {
          className: "dsh-msg-rail",
          style: {
            left: rail.left + "px",
            top: rail.top + "px",
            height: rail.height + "px",
            gap: rail.gap + "px"
          }
        },
        markers.map(function (m, i) {
          var pos = bubbles[m.index];
          var cls = "dsh-msg-marker" + (i === activeIndex ? " active" : "");
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
    var name = "dsh-message-pointer";
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
      }, "dsh-message-pointer: style cleanup");
    }

    return { name: name, inject: inject, apply: apply };
  }
});
