// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import {
  STYLE_ID,
  CSS,
  injectStyle,
  removeStyle,
  collectUserRows,
} from '../src/core'

function makeScrollport(userTexts: string[]): HTMLElement {
  const sp = document.createElement('div')
  sp.setAttribute('data-conversation-scroll', '')
  for (const text of userTexts) {
    const row = document.createElement('div')
    row.setAttribute('data-chat-flow-kind', 'user')
    row.textContent = text
    sp.appendChild(row)
  }
  // one non-user row that must be ignored
  const assistant = document.createElement('div')
  assistant.setAttribute('data-chat-flow-kind', 'assistant')
  assistant.textContent = 'ignored assistant text'
  sp.appendChild(assistant)
  return sp
}

describe('collectUserRows', () => {
  it('returns one row object per user message', () => {
    const sp = makeScrollport(['hello', 'world'])
    const rows = collectUserRows(sp)
    expect(rows).toHaveLength(2)
    expect(rows[0].preview).toBe('hello')
    expect(rows[1].preview).toBe('world')
    expect(rows[0].el).toBeInstanceOf(HTMLElement)
  })

  it('ignores non-user rows', () => {
    const sp = makeScrollport(['only'])
    const rows = collectUserRows(sp)
    expect(rows).toHaveLength(1)
    expect(rows[0].preview).toBe('only')
  })

  it('slices raw preview to 200 chars and trims', () => {
    const long = 'x'.repeat(300)
    // '  ' + 300 'x' + ' y  ' → first 200 chars = '  ' + 198 'x' → trim → 198 'x'
    const sp = makeScrollport(['  ' + long + ' y  '])
    const rows = collectUserRows(sp)
    expect(rows[0].preview).toBe('x'.repeat(198))
    expect(rows[0].preview).toHaveLength(198)
  })

  it('returns [] for a null scrollport', () => {
    expect(collectUserRows(null)).toEqual([])
  })
})

describe('style injection', () => {
  beforeEach(() => {
    const prev = document.getElementById(STYLE_ID)
    if (prev) prev.remove()
  })

  it('injects the style tag exactly once', () => {
    injectStyle()
    const tag = document.getElementById(STYLE_ID)
    expect(tag).not.toBeNull()
    expect(tag!.tagName).toBe('STYLE')
    expect(tag!.textContent).toBe(CSS)
    injectStyle()
    expect(document.querySelectorAll('#' + STYLE_ID)).toHaveLength(1)
  })

  it('removeStyle deletes the injected tag', () => {
    injectStyle()
    removeStyle()
    expect(document.getElementById(STYLE_ID)).toBeNull()
  })
})