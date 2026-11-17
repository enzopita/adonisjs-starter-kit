import { defineConfig, stores } from '@adonisjs/limiter';

import env from '#start/env';

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE'),
  stores: {
    redis: stores.redis({
      connectionName: 'main',
      rejectIfRedisNotReady: false,
    }),

    // Used in tests (LIMITER_STORE=memory), so a test run never shares state with Redis.
    memory: stores.memory({}),
  },
});

export default limiterConfig;

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
