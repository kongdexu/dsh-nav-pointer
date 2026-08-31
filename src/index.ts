// dsh-nav-pointer — host half.
// Registers a schemastery settings namespace so the browser half can bind its
// preferences through ctx.settingsScope, with the composition entry config as the base layer.
// The settings service is optional: `ctx.inject(['settings'])` falls back to the
// composition entry when no provider is mounted (dsh-settings >= 0.1.2-alpha.2 ABI).
import type { Context } from '@deepseek-ai/cordis'
// Type-only import — pulls the `Context.settings` service augmentation from
// @deepseek-ai/dsh-settings so the `ctx.inject(['settings'])` callback is typed.
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import { SETTINGS_NAMESPACE, DEFAULT_CONFIG, type NavPointerConfig } from './config'

export const name = 'dsh-nav-pointer'
export const inject: readonly string[] = []

/** Cordis validates the plugin's composition entry config against this schema. */
export const Config = z.object({
  scrollMs: z.number().min(60).max(2000).default(DEFAULT_CONFIG.scrollMs),
  railEnabled: z.boolean().default(DEFAULT_CONFIG.railEnabled),
  bubbleEnabled: z.boolean().default(DEFAULT_CONFIG.bubbleEnabled),
  keyboardEnabled: z.boolean().default(DEFAULT_CONFIG.keyboardEnabled),
})

export function apply(ctx: Context, config?: Partial<NavPointerConfig>): void {
  const entry: NavPointerConfig = { ...DEFAULT_CONFIG, ...(config ?? {}) }
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, Config, entry, {
      setSource: () => {},
      onChange: () => {},
    })
  })
}