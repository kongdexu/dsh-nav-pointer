import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const puppeteer = require('C:/Users/Administrator/.dsh/profiles/web/node_modules/puppeteer-core')

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '.verify')
mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1440,900'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
page.setDefaultTimeout(30000)

await page.goto('http://127.0.0.1:3080/', { waitUntil: 'networkidle2', timeout: 45000 }).catch((e) => console.log('[goto warn]', e.message))
await sleep(3000)

// Open Settings (bottom sidebar).
await page.evaluate(() => {
  const hits = [...document.querySelectorAll('button,[role="button"],a,div')]
    .filter((e) => (e.textContent || '').replace(/\s+/g, ' ').trim() === '设置')
  hits.sort((a, b) => (b.getBoundingClientRect?.().top || 0) - (a.getBoundingClientRect?.().top || 0))
  hits[0]?.click()
}).catch(() => {})
await sleep(2000)

// Click "消息指针".
await page.evaluate(() => {
  const all = [...document.querySelectorAll('*')]
  const hit = all.find((e) => (e.textContent || '').replace(/\s+/g, ' ').trim() === '消息指针')
  hit?.click()
}).catch(() => {})
await sleep(2000)

const panel = await page.evaluate(() => {
  const root = document.querySelector('.dsh-msg-settings')
  if (!root) return { rendered: false }
  const rows = [...root.querySelectorAll('.dsh-msg-settings-row')]
  return {
    rendered: true,
    rowCount: rows.length,
    labels: rows.map((r) => (r.querySelector('.dsh-msg-settings-label')?.textContent || '').trim()),
    hints: rows.map((r) => (r.querySelector('.dsh-msg-settings-hint')?.textContent || '').trim()),
    numberInputs: root.querySelectorAll('input[type="number"]').length,
    checkboxes: root.querySelectorAll('input[type="checkbox"]').length,
    checkboxChecked: [...root.querySelectorAll('input[type="checkbox"]')].map((c) => c.checked),
    numberValue: root.querySelector('input[type="number"]')?.value,
    compressRowPresent: rows.some((r) => /压缩|compress/i.test(r.textContent || '')),
  }
})
console.log('[panel]', JSON.stringify(panel, null, 2))
await page.screenshot({ path: join(OUT, 'pointer-section-4rows.png'), fullPage: true })
await browser.close()
console.log('[done]', OUT)
