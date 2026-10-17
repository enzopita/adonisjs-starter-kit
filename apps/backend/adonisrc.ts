import { indexEntities } from '@adonisjs/core/generators'
import { defineConfig } from '@adonisjs/core/app'
import { generateRegistry } from '@tuyau/core/hooks'

export default defineConfig({
  /*
  |--------------------------------------------------------------------------
  | Experimental flags
  |--------------------------------------------------------------------------
  |
  | The following features will be enabled by default in the next major release
  | of AdonisJS. You can opt into them today to avoid any breaking changes
  | during upgrade.
  |
  */
  experimental: {},

  /*
  |--------------------------------------------------------------------------
  | Commands
  |--------------------------------------------------------------------------
  |
  | List of ace commands to register from packages. The application commands
  | will be scanned automatically from the "./commands" directory.
  |
  */
  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
    () => import('@adonisjs/session/commands'),
    () => import('@adonisjs/mail/commands'),
    () => import('@adonisjs/queue/commands'),
  ],

  /*
  |--------------------------------------------------------------------------
  | Service providers
  |--------------------------------------------------------------------------
  |
  | List of service providers to import and register when booting the
  | application
  |
  */
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],
    },
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/session/session_provider'),
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
  ],

  /*
  |--------------------------------------------------------------------------
  | Preloads
  |--------------------------------------------------------------------------
  |
  | List of modules to import before starting the application.
  |
  */
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
  ],

  /*
  |--------------------------------------------------------------------------
  | Tests
  |--------------------------------------------------------------------------
  |
  | List of test suites to organize tests by their type. Feel free to remove
  | and add additional suites.
  |
  */
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

  /*
  |--------------------------------------------------------------------------
  | Metafiles
  |--------------------------------------------------------------------------
  |
  | A collection of files you want to copy to the build folder when creating
  | the production build.
  |
  */
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
      generateRegistry(),
    ],
  },
})
