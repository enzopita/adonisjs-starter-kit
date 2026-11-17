import { defineConfig, drivers } from '@adonisjs/queue';

import env from '#start/env';

export default defineConfig({
  default: env.get('QUEUE_DRIVER'),

  adapters: {
    redis: drivers.redis({
      connectionName: 'main',
    }),
    sync: drivers.sync(),
  },

  worker: {
    concurrency: 5,
    idleDelay: '2s',
  },

  locations: ['./app/*/jobs/**/*.{ts,js}'],
});
