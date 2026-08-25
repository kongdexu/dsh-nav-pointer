import { describe, it, expect } from 'vitest'
import {
  clamp,
  truncate,
  easeOutCubic,
  normalizePreview,
  computeRailLayout,
  deriveActiveIndex,
} from '../src/core'

describe('clamp', () => {
  it('keeps values inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
  it('clamps below the lower bound', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
  })
  it('clamps above the upper bound', () => {
    expect(clamp(11, 0, 10)).toBe(10)
  })
  it('returns lo when v equals lo', () => {
    expect(clamp(0, 0, 10)).toBe(0)
  })
  it('returns hi when v equals hi', () => {
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('truncate', () => {
  it('keeps strings within the limit unchanged', () => {
    expect(truncate('abc', 5)).toBe('abc')
  })
  it('truncates and appends ellipsis', () => {
    expect(truncate('abcdef', 4)).toBe('abc…')
  })
  it('handles exact boundary', () => {
    expect(truncate('abcd', 4)).toBe('abcd')
  })
})

describe('easeOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })
  it('is monotonic and mid-value sits in range', () => {
    const mid = easeOutCubic(0.5)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })
})

describe('normalizePreview', () => {
  it('collapses whitespace', () => {
    expect(normalizePreview('a\n\nb   c')).toBe('a b c')
  })
  it('truncates to 100 chars with ellipsis', () => {
    const out = normalizePreview('x'.repeat(200))
    expect(out).toBe('x'.repeat(99) + '…')
  })
})

describe('computeRailLayout', () => {
  it('centers a natural-height rail inside a taller viewport', () => {
    // 3 rows -> 3*16 + 2*1 = 50; viewport 200 -> topOffset 75
    const r = computeRailLayout({ count: 3, viewportHeight: 200 })
    expect(r.gap).toBe(1)
    expect(r.railHeight).toBe(50)
    expect(r.topOffset).toBe(75)
    expect(r.leftOffset).toBe(16)
  })

  it('fills the viewport and compresses gap to zero when overflowing', () => {
    // 100 rows * 16 = 1600 > 400 viewport -> railHeight 400, gap compressed
    const r = computeRailLayout({ count: 100, viewportHeight: 400 })
    expect(r.railHeight).toBe(400)
    expect(r.gap).toBeGreaterThanOrEqual(0)
    expect(r.topOffset).toBe(0)
    // exact gap: (400 - 1600) / 99 = -12.12... clamped to 0
    expect(r.gap).toBe(0)
  })

  it('uses default bar height and gap', () => {
    const r = computeRailLayout({ count: 1, viewportHeight: 100 })
    expect(r.railHeight).toBe(16)
    expect(r.gap).toBe(1)
    expect(r.topOffset).toBe(42)
  })

  it('handles zero rows gracefully', () => {
    const r = computeRailLayout({ count: 0, viewportHeight: 100 })
    expect(r.railHeight).toBe(0)
    expect(r.gap).toBe(1)
  })
})

describe('deriveActiveIndex', () => {
  it('returns -1 for empty conversation', () => {
    expect(deriveActiveIndex({ count: 0, rowTops: [], viewportHeight: 100 })).toBe(-1)
  })

  it('anchors to the last row when at bottom', () => {
    expect(
      deriveActiveIndex({ count: 5, rowTops: [0, 100, 200, 300, 400], viewportHeight: 100, atBottom: true }),
    ).toBe(4)
  })

  it('picks the last row above the 35% line', () => {
    const viewportHeight = 100
    const line = viewportHeight * 0.35 // 35px
    // rows at 0, 20, 40(v>35) -> active should be index 1 (20 <= 35)
    expect(
      deriveActiveIndex({ count: 3, rowTops: [0, 20, 40], viewportHeight }),
    ).toBe(1)
  })

  it('starts at index 0 when the first row is already below the line', () => {
    expect(
      deriveActiveIndex({ count: 3, rowTops: [60, 80, 100], viewportHeight: 100 }),
    ).toBe(0)
  })

  it('respects a custom threshold', () => {
    // threshold 0.5 → line = 50; rowTops[1]=45 ≤ 50 → active=1
    expect(
      deriveActiveIndex({ count: 2, rowTops: [30, 45], viewportHeight: 100, threshold: 0.5 }),
    ).toBe(1)
  })
})