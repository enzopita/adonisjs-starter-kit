import { defineConfig } from '@adonisjs/redis';
import type { InferConnections } from '@adonisjs/redis/types';

import env from '#start/env';

const redisConfig = defineConfig({
  connection: 'main',

  connections: {
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD')?.release(),
      db: 0,
      keyPrefix: '',
      // Never give up: ioredis stops for good on null, which would leave the queue worker and
      // the limiter store broken until a restart that the liveness probe never triggers.
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    },
  },
});

export default redisConfig;

declare module '@adonisjs/redis/types' {
  export interface RedisConnections extends InferConnections<
    typeof redisConfig
  > {}
}
