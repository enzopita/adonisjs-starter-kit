import { julrPreset } from '@julr/tooling-configs/oxc/fmt'

const preset = julrPreset()

export default {
  ...preset,
  ignorePatterns: [
    ...(preset.ignorePatterns ?? []),
    // Rewritten by tools: `e2e init` (skill) and the e2e runner (replay cache).
    '.agents/skills/e2e/**',
    '.e2e/**',
    // Vendored by `npx skills add shadcn/ui`; skills-lock.json pins its hash.
    '.agents/skills/shadcn/**',
    'skills-lock.json',
    // Written by `node ace openapi:generate`, which `openapi:check` compares byte for byte.
    'apps/backend/openapi.json',
  ],
}
