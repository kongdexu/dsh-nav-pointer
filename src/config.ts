// Shared settings footprint between the host (schema/base) and client (scope reads).

export const SETTINGS_NAMESPACE = 'dsh-nav-pointer'

export interface NavPointerConfig {
  /** Fixed duration (ms) of the click/keyboard jump animation. */
  scrollMs: number
  /** Whether the pointer rail renders at all. */
  railEnabled: boolean
  /** Whether the hover preview bubble shows. */
  bubbleEnabled: boolean
  /** Enable Alt+↑/↓ keyboard jumps. */
  keyboardEnabled: boolean
}

export const DEFAULT_CONFIG: NavPointerConfig = {
  scrollMs: 260,
  railEnabled: true,
  bubbleEnabled: true,
  keyboardEnabled: true,
}