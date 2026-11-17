import { defineConfig } from '@adonisjs/core/app';
import { indexEntities } from '@adonisjs/core/generators';
import { generateRegistry } from '@tuyau/core/hooks';

export default defineConfig({
  experimental: {},

  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
    () => import('@adonisjs/mail/commands'),
    () => import('@adonisjs/queue/commands'),
    () => import('@enzopita/adonisjs-openapi/commands'),
  ],

  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],
    },
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/shield/shield_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('#providers/api_provider'),
    () => import('@adonisjs/core/providers/edge_provider'),
    () => import('@adonisjs/mail/mail_provider'),
    () => import('@adonisjs/drive/drive_provider'),
    () => import('@adonisjs/redis/redis_provider'),
    () => import('@adonisjs/queue/queue_provider'),
    () => import('@adonisjs/bouncer/bouncer_provider'),
    () => import('@adonisjs/i18n/i18n_provider'),
    () => import('@adonisjs/limiter/limiter_provider'),
  ],

  preloads: [
    () => import('#start/kernel'),
    () => import('#start/validator'),
    () => import('#start/mail'),
    { file: () => import('#start/scheduler'), environment: ['web'] },

    // core
    () => import('#core/routes'),

    // users
    () => import('#users/routes'),

    // auth
    () => import('#auth/routes'),
    () => import('#auth/start/events'),

    // attachments
    () => import('#attachments/routes'),

    // tenancy
    () => import('#tenancy/routes'),

    // access
    () => import('#access/routes'),
    () => import('#access/start/events'),

    // audit
    () => import('#audit/routes'),

    // admin
    () => import('#admin/routes'),
    () => import('#admin/start/events'),
  ],

  tests: {
    suites: [
      {
        files: ['app/**/tests/unit/**/*.spec.{ts,js}'],
        name: 'unit',
        timeout: 2000,
      },
      {
        files: ['app/**/tests/functional/**/*.spec.{ts,js}'],
        name: 'functional',
        timeout: 30000,
      },
    ],
    forceExit: false,
  },

  metaFiles: [
    {
      pattern: 'resources/lang/**/*.{json,yaml,yml}',
      reloadServer: false,
    },
    {
      pattern: 'resources/views/**/*.edge',
      reloadServer: false,
    },
  ],

  hooks: {
    init: [
      indexEntities({
        controllers: {
          enabled: true,
          source: './app',
          glob: ['**/*_controller.ts'],
          importAlias: '#app',
        },
        transformers: {
          enabled: true,
          source: './app',
          glob: ['**/*_transformer.ts'],
          importAlias: '#app',
        },
      }),
      // The docs routes exist only outside production, so the typed client must not offer them.
      generateRegistry({ routes: { except: [/^openapi\./] } }),
    ],
  },
});
