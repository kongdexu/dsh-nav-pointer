import { describe, it, expect } from 'vitest'
import { DEFAULT_CONFIG, SETTINGS_NAMESPACE } from '../src/config'

describe('settings footprint', () => {
  it('uses the dsh-nav-pointer namespace', () => {
    expect(SETTINGS_NAMESPACE).toBe('dsh-nav-pointer')
  })

  it('resolves the documented defaults', () => {
    expect(DEFAULT_CONFIG).toEqual({
      scrollMs: 260,
      railEnabled: true,
      bubbleEnabled: true,
      keyboardEnabled: true,
    })
  })
})