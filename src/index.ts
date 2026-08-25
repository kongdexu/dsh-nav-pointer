// dsh-nav-pointer — host half.
// Registers a schemastery settings namespace so the browser half can bind its
// preferences through ctx.settingsScope, with the composition entry config as the base layer.
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
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

const NS = settingsNamespace(SETTINGS_NAMESPACE)

export function apply(ctx: Context, config?: Partial<NavPointerConfig>): void {
  const entry: NavPointerConfig = { ...DEFAULT_CONFIG, ...(config ?? {}) }
  installSettingsSection(ctx, NS, Config, entry, {
    setSource: () => {},
    onChange: () => {},
  })
}