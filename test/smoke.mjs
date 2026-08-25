// Smoke test: load lib/client.js the way the DSH client module loader does,
// then assert the plugin exports the expected shape and registers the
// `shell.overlay` slot correctly. No browser required.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const clientSrc = readFileSync(path.join(root, '..', 'lib', 'client.js'), 'utf8');

let plugin = null;
let injectedCss = '';

const react = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  useState: (init) => [init, () => {}],
  useEffect: () => {},
  useRef: (init) => ({ current: init }),
  useMemo: () => {},
};

const documentMock = {
  getElementById: () => null,
  createElement: (tag) => {
    const el = { id: '', textContent: '', tagName: tag.toUpperCase() };
    return el;
  },
  head: { appendChild: (el) => { injectedCss = el.textContent; } },
};

globalThis.window = {
  __ModuleLoader__: {
    load(mod) {
      plugin = mod.factory((name) => {
        if (name === 'react') return react;
        throw new Error('unexpected require: ' + name);
      });
    },
  },
};

let failures = 0;
const assert = (cond, msg) => {
  if (cond) console.log('  ok  ' + msg);
  else { console.error('  FAIL ' + msg); failures += 1; }
};

new Function('window', 'document', clientSrc)(globalThis.window, documentMock);

assert(!!plugin, 'factory returned a plugin object');
assert(plugin && plugin.name === 'dsh-nav-pointer', 'plugin name is dsh-nav-pointer');
assert(Array.isArray(plugin && plugin.inject), 'inject is an array');
assert(plugin && plugin.inject.includes('slots'), 'inject declares the "slots" service');
assert(plugin && plugin.inject.includes('settingsScope'), 'inject declares the "settingsScope" service');
assert(typeof plugin?.apply === 'function', 'apply is a function');

// Run apply() against a mock client ctx and observe slot registration.
const registrations = [];
const scopeMock = {
  getSnapshot() {
    return {
      status: 'ready',
      value: { scrollMs: 260, railEnabled: true, bubbleEnabled: true, keyboardEnabled: true },
      writable: true,
      mode: 'host',
    };
  },
  subscribe() { return () => {}; },
  set() { return Promise.resolve(); },
  unset() { return Promise.resolve(); },
};
const ctx = {
  slots: {
    inject(name, cb) {
      const dispose = cb();
      registrations.push(['inject', name, dispose]);
    },
    register(opts, Component) {
      registrations.push(['register', opts, Component]);
      return () => {};
    },
  },
  settingsScope: { bind: () => scopeMock },
  effect() {},
};
if (plugin) plugin.apply(ctx);

const reg = registrations.find(([k]) => k === 'register');
assert(!!reg, 'apply() registers a slot');
assert(reg && reg[1].name === 'shell.overlay', 'slot name is shell.overlay');
assert(reg && reg[1].id === 'message-pointer-rail', 'slot id is message-pointer-rail');
assert(typeof reg?.[2] === 'function', 'slot component is a function');

const sett = registrations.find(([k, o]) => k === 'register' && o && o.name === 'settings.section');
assert(!!sett, 'apply() registers a settings.section when settingsScope is bound');
assert(sett && sett[1].id === 'dsh-nav-pointer', 'settings section id is dsh-nav-pointer');
assert(typeof sett?.[2] === 'function', 'settings section component is a function');
assert(injectedCss.includes('.dsh-msg-rail'), 'CSS includes the rail class');
assert(injectedCss.includes('height:16px'), 'CSS marker height is 16px (v17 spec)');
assert(injectedCss.includes('.dsh-msg-rail.scrubbing'), 'CSS includes scrub grabbing cursor state');

console.log(failures === 0 ? 'SMOKE PASS' : `SMOKE FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);