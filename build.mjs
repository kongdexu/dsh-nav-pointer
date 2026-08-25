// Build dsh-nav-pointer:
//   src/client.ts -> lib/client.js  (iife wrapped in window.__ModuleLoader__.load, react external)
//   src/index.ts  -> lib/index.js   (esm host entry)
//   src/types/**  -> lib/types/**   (hand-written d.ts copied verbatim)
import { build } from 'esbuild'
import { cpSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const libDir = resolve(root, 'lib')

rmSync(libDir, { recursive: true, force: true })

const BUNDLE_GLOBAL = '__dshnavBundle'

await build({
  entryPoints: [resolve(root, 'src/client.ts')],
  bundle: true,
  format: 'iife',
  globalName: BUNDLE_GLOBAL,
  target: 'es2020',
  platform: 'browser',
  external: ['react'],
  logLevel: 'info',
  banner: {
    js: 'window.__ModuleLoader__.load({id:"dsh-nav-pointer",factory:function(require){',
  },
  footer: {
    js: `return ${BUNDLE_GLOBAL};}});`,
  },
  outfile: resolve(libDir, 'client.js'),
})

await build({
  entryPoints: [resolve(root, 'src/index.ts')],
  bundle: true,
  format: 'esm',
  target: 'node20',
  platform: 'node',
  external: ['@deepseek-ai/schemastery', '@deepseek-ai/dsh-settings', '@deepseek-ai/cordis'],
  logLevel: 'info',
  outfile: resolve(libDir, 'index.js'),
})

cpSync(resolve(root, 'src/types'), resolve(libDir, 'types'), { recursive: true })

console.log('build: lib/ client.js, index.js, types/ written')
