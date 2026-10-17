import { defineConfig, type OxlintOverride } from 'oxlint'
import { julrPreset } from '@julr/tooling-configs/oxc/lint'
import backendModules from './apps/backend/modules.json' with { type: 'json' }
import frontendFeatures from './apps/frontend/features.json' with { type: 'json' }

const BACKEND_APP = 'apps/backend/app'

// Aliases outside app/ that any module may import.
const SHARED_ALIASES = ['#start', '#config', '#database', '#generated']

function restrictImports(files: string, allowed: string[], message: string): OxlintOverride {
  return {
    files: [files],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['#*/**', ...allowed.map(alias => `!${alias}/**`)], message },
            {
              group: ['../**'],
              message:
                'Import through the module alias (#<module>/...) instead of a parent-relative path.',
            },
          ],
        },
      ],
    },
  }
}

const moduleBoundaries = [
  restrictImports(
    `${BACKEND_APP}/**`,
    SHARED_ALIASES,
    'This folder is not a registered module: add it to apps/backend/modules.json (node ace make:module does it).',
  ),
  ...Object.entries(backendModules).flatMap(([name, deps]: [string, string[]]) => {
    const allowed = [`#${name}`, ...SHARED_ALIASES, ...deps.map(dep => `#${dep}`)]
    const message = `Module "${name}" may import ${deps.join(', ') || 'no other module'}. A new dependency goes in apps/backend/modules.json first.`

    return [
      restrictImports(`${BACKEND_APP}/${name}/**`, allowed, message),
      restrictImports(`${BACKEND_APP}/${name}/tests/**`, [...allowed, '#tests'], message),
    ]
  }),
]

const FRONTEND_FEATURES = 'apps/frontend/src/features'

const featureBoundaries = [
  restrictFeatureImports(
    `${FRONTEND_FEATURES}/**`,
    [],
    'This folder is not a registered feature: add it to apps/frontend/features.json.',
  ),
  ...Object.entries(frontendFeatures).map(([name, deps]: [string, string[]]) =>
    restrictFeatureImports(
      `${FRONTEND_FEATURES}/${name}/**`,
      [name, ...deps],
      `Feature "${name}" may import ${deps.join(', ') || 'no other feature'}. A new dependency goes in apps/frontend/features.json first.`,
    ),
  ),
]

function restrictFeatureImports(files: string, allowed: string[], message: string): OxlintOverride {
  return {
    files: [files],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/**', ...allowed.map(name => `!@/features/${name}/**`)],
              message,
            },
            {
              group: ['@/router', '@/routes/**'],
              message:
                'Routes import features, never the reverse: read route data with getRouteApi().',
            },
            {
              group: ['../**', './**'],
              message: 'Import through @/features/<feature>/... instead of a relative path.',
            },
          ],
        },
      ],
    },
  }
}

const designSystem: OxlintOverride[] = [
  {
    files: ['apps/frontend/src/**', 'packages/ui/src/**'],
    rules: {
      'shadcn/no-restyle': ['error', { allow: ['layout'] }],
      'shadcn/no-raw-colors': 'error',
      'shadcn/no-arbitrary-values': ['error', { allow: ['layout'] }],
      'shadcn/no-inline-styles': 'error',
      'shadcn/require-static-classes': 'error',
      'shadcn/no-unknown-classes': 'error',
    },
  },
  {
    files: ['apps/frontend/src/**', 'packages/ui/src/**'],
    rules: { 'i18n/no-untranslated-text': 'error' },
  },
  {
    // Components own their appearance and may need structural values such as ring-[3px].
    files: ['packages/ui/src/components/**'],
    rules: {
      'shadcn/no-restyle': 'off',
      'shadcn/no-arbitrary-values': 'off',
      'shadcn/require-static-classes': 'off',
    },
  },
]

export default defineConfig({
  extends: [julrPreset({ adonisjs: true })],
  jsPlugins: [
    '@shadcn/lint',
    { name: 'anti-slop', specifier: './tools/oxlint/anti-slop/index.ts' },
    { name: 'i18n', specifier: './tools/oxlint/i18n/index.ts' },
  ],

  ignorePatterns: [
    // TODO: remove once https://github.com/oxc-project/oxc/issues/10223 is fixed
    '**/.adonisjs/**',
    'node_modules/**',
    'dist/**',
    'build/**',
    '*.yml',
    // Installed agent tooling and the vendored plugin are not project source.
    '.agent/**',
    '.agents/**',
    '.claude/**',
    '.codex/**',
    '.continue/**',
    '.cursor/**',
    '.gemini/**',
    '.opencode/**',
    '.pi/**',
    '.roo/**',
    '.windsurf/**',
    '.e2e/**',
    'tools/oxlint/anti-slop/**',
  ],

  rules: {
    'oxc/no-accumulating-spread': 'error',
    'anti-slop/no-array-filter-map': 'error',
    'anti-slop/no-reduce-accumulator-copy': 'error',
    'anti-slop/no-chained-type-assertions': 'error',
    'anti-slop/no-conditional-empty-object-spread': 'error',
    'anti-slop/no-known-value-widening': 'error',
    'anti-slop/no-module-mocking': 'error',
    'anti-slop/no-object-parameters': 'error',
    'anti-slop/no-reflect-apply': 'error',
    'anti-slop/no-reflect-get': 'error',
    'anti-slop/no-runtime-typeof': 'error',
    'anti-slop/no-shape-in-symbol-names': 'error',
    'anti-slop/no-unknown-parameters': 'error',
    'anti-slop/no-unknown-returns': 'error',
    'anti-slop/no-unknown-type-aliases': 'error',
    'anti-slop/no-unsafe-dictionary-type': 'error',
    'anti-slop/no-widen-then-assert': 'error',
    'anti-slop/require-readable-spacing': 'error',
    'anti-slop/require-safety-comment-for-type-assertion': 'error',
  },

  overrides: [
    ...moduleBoundaries,
    ...featureBoundaries,
    ...designSystem,
    {
      files: ['apps/backend/**'],
      rules: {
        'no-restricted-properties': [
          'error',
          {
            object: 'mail',
            property: 'send',
            message:
              'Queue mail with mail.sendLater(): the worker delivers it with retries (start/mail.ts).',
          },
        ],
      },
    },
  ],
})
