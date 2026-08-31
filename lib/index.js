// src/index.ts
import z from "@deepseek-ai/schemastery";

// src/config.ts
var SETTINGS_NAMESPACE = "dsh-nav-pointer";
var DEFAULT_CONFIG = {
  scrollMs: 260,
  railEnabled: true,
  bubbleEnabled: true,
  keyboardEnabled: true
};

// src/index.ts
var name = "dsh-nav-pointer";
var inject = [];
var Config = z.object({
  scrollMs: z.number().min(60).max(2e3).default(DEFAULT_CONFIG.scrollMs),
  railEnabled: z.boolean().default(DEFAULT_CONFIG.railEnabled),
  bubbleEnabled: z.boolean().default(DEFAULT_CONFIG.bubbleEnabled),
  keyboardEnabled: z.boolean().default(DEFAULT_CONFIG.keyboardEnabled)
});
function apply(ctx, config) {
  const entry = { ...DEFAULT_CONFIG, ...config ?? {} };
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, Config, entry, {
      setSource: () => {
      },
      onChange: () => {
      }
    });
  });
}
export {
  Config,
  apply,
  inject,
  name
};
