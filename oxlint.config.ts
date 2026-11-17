import { defineConfig } from 'oxlint';
import type { OxlintOverride } from 'oxlint';
import core from 'ultracite/oxlint/core';
import react from 'ultracite/oxlint/react';
import tanstack from 'ultracite/oxlint/tanstack';

import backendModules from './apps/backend/modules.json' with { type: 'json' };
import frontendFeatures from './apps/frontend/features.json' with { type: 'json' };

const BACKEND_APP = 'apps/backend/app';

// Aliases outside app/ that any module may import.
const SHARED_ALIASES = ['#start', '#config', '#database', '#generated'];

function restrictImports(
  files: string,
  allowed: string[],
  message: string
): OxlintOverride {
  return {
    files: [files],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['#*/**', ...allowed.map((alias) => `!${alias}/**`)],
              message,
            },
            {
              group: ['../**'],
              message:
                'Import through the module alias (#<module>/...) instead of a parent-relative path.',
            },
          ],
        },
      ],
    },
  };
}

const moduleBoundaries = [
  restrictImports(
    `${BACKEND_APP}/**`,
    SHARED_ALIASES,
    'This folder is not a registered module: add it to apps/backend/modules.json (node ace make:module does it).'
  ),
  ...Object.entries(backendModules).flatMap(
    ([name, deps]: [string, string[]]) => {
      const allowed = [
        `#${name}`,
        ...SHARED_ALIASES,
        ...deps.map((dep) => `#${dep}`),
      ];

      const message = `Module "${name}" may import ${deps.join(', ') || 'no other module'}. A new dependency goes in apps/backend/modules.json first.`;

      return [
        restrictImports(`${BACKEND_APP}/${name}/**`, allowed, message),
        restrictImports(
          `${BACKEND_APP}/${name}/tests/**`,
          [...allowed, '#tests'],
          message
        ),
      ];
    }
  ),
];

const FRONTEND_FEATURES = 'apps/frontend/src/features';

const featureBoundaries = [
  restrictFeatureImports(
    `${FRONTEND_FEATURES}/**`,
    [],
    'This folder is not a registered feature: add it to apps/frontend/features.json.'
  ),
  ...Object.entries(frontendFeatures).map(([name, deps]: [string, string[]]) =>
    restrictFeatureImports(
      `${FRONTEND_FEATURES}/${name}/**`,
      [name, ...deps],
      `Feature "${name}" may import ${deps.join(', ') || 'no other feature'}. A new dependency goes in apps/frontend/features.json first.`
    )
  ),
];

function restrictFeatureImports(
  files: string,
  allowed: string[],
  message: string
): OxlintOverride {
  return {
    files: [files],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features/**',
                ...allowed.map((name) => `!@/features/${name}/**`),
              ],
              message,
            },
            {
              group: ['@/router', '@/routes/**'],
              message:
                'Routes import features, never the reverse: read route data with getRouteApi().',
            },
            {
              group: ['../**', './**'],
              message:
                'Import through @/features/<feature>/... instead of a relative path.',
            },
          ],
        },
      ],
    },
  };
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
];

// Where Ultracite's presets contradict AdonisJS or this codebase's own conventions.
const conventions: OxlintOverride[] = [
  {
    files: ['**/*'],
    rules: {
      // Components and helpers are function declarations; small callbacks stay arrows.
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      // A file reads top-down: the exported component or function first, its helpers below.
      'no-use-before-define': [
        'error',
        { functions: false, classes: true, variables: true },
      ],
      // Data shapes are type aliases, since interfaces have no implicit index signature and
      // serialize() and Tuyau stop inferring response types from them; `declare module`
      // augmentation must stay an interface to merge.
      'typescript/consistent-type-definitions': 'off',
    },
  },
  {
    files: ['apps/backend/**'],
    rules: {
      // AdonisJS names files in snake_case and its generators (node ace make:*) follow it.
      'unicorn/filename-case': ['error', { case: 'snakeCase' }],
      // The container instantiates controllers, actions, middleware and jobs, so methods that
      // don't touch `this` are still instance methods.
      'class-methods-use-this': 'off',
      // Lucid query builders are lazy thenables: making the functions that return them async
      // runs the query and breaks chaining.
      'typescript/promise-function-async': 'off',
      // `@tags` and `@response` feed @enzopita/adonisjs-openapi.
      'jsdoc/check-tag-names': ['error', { definedTags: ['tags', 'response'] }],
      // `import type {} from '...'` loads a module's type augmentation without a runtime import.
      'import/no-empty-named-blocks': 'off',
      'unicorn/require-module-specifiers': 'off',
      // AdonisJS registers config types by augmenting empty interfaces (`interface X extends
      // InferY<typeof config> {}`).
      'typescript/no-empty-interface': 'off',
      'typescript/no-empty-object-type': 'off',
    },
  },
  {
    // `node ace make:migration` writes `export default class extends BaseSchema` with async
    // up/down that only queue schema calls.
    files: ['apps/backend/database/migrations/**'],
    rules: {
      'unicorn/no-anonymous-default-export': 'off',
      'require-await': 'off',
    },
  },
  {
    // AdonisJS types NextFn as returning any, and node/callback-return requires `return next()`.
    files: [
      'apps/backend/app/**/middleware/**',
      'apps/backend/app/**/routes.ts',
    ],
    rules: { 'typescript/no-unsafe-return': 'off' },
  },
  {
    // Tests and scripts await in loops on purpose: rate limiters, the global test transaction's
    // single connection, UI steps in one browser, polling.
    files: ['**/tests/**', 'tests/**', 'scripts/**'],
    rules: { 'no-await-in-loop': 'off' },
  },
];

export default defineConfig({
  // extends doesn't carry env and ignorePatterns, so they are repeated here.
  env: core.env,
  extends: [core],
  ignorePatterns: [
    ...core.ignorePatterns,
    // AdonisJS writes generated code to .adonisjs/, which Ultracite's list doesn't cover.
    '**/.adonisjs/**',
    // Rewritten by `node ace migration:run`.
    'apps/backend/database/schema.ts',
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
  jsPlugins: [
    '@adonisjs/eslint-plugin',
    '@shadcn/lint',
    { name: 'anti-slop', specifier: './tools/oxlint/anti-slop/index.ts' },
    { name: 'i18n', specifier: './tools/oxlint/i18n/index.ts' },
  ],
  options: { typeAware: true },
  rules: {
    '@adonisjs/prefer-lazy-controller-import': 'error',
    '@adonisjs/prefer-lazy-listener-import': 'error',
    // Ids, timestamps and tokens are never "", and the body parser turns empty input into null,
    // so `if (value)` on a nullable string or boolean says what the code means.
    'typescript/strict-boolean-expressions': [
      'error',
      { allowNullableString: true, allowNullableBoolean: true },
    ],
    // Assertions are allowed with a SAFETY comment (anti-slop/require-safety-comment-for-type-assertion).
    'typescript/no-unsafe-type-assertion': 'off',
    // TanStack Router guards redirect by throwing redirect(), a Response.
    'typescript/only-throw-error': [
      'error',
      {
        allow: [
          {
            from: 'package',
            package: '@tanstack/router-core',
            name: 'Redirect',
          },
        ],
      },
    ],
    // Lucid and Knex query builders are thenables that only run when awaited.
    'typescript/no-floating-promises': [
      'error',
      {
        allowForKnownSafePromises: [
          {
            from: 'package',
            package: '@adonisjs/lucid',
            name: [
              'ExcutableQueryBuilderContract',
              'ModelQueryBuilderContract',
              'DatabaseQueryBuilderContract',
              'InsertQueryBuilderContract',
              'RawQueryBuilderContract',
              'ChainableContract',
              'RelationQueryBuilderContract',
              'RelationSubQueryBuilderContract',
              'HasManyQueryBuilderContract',
              'HasManyThroughQueryBuilderContract',
              'ManyToManyQueryBuilderContract',
              'ManyToManySubQueryBuilderContract',
            ],
          },
          { from: 'package', package: 'knex', name: 'QueryBuilder' },
        ],
      },
    ],
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
    {
      files: ['apps/frontend/**', 'packages/ui/**'],
      plugins: react.plugins,
      rules: react.rules,
    },
    ...tanstack.overrides,
    ...conventions,
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
});
