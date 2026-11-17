import {
  HealthChecks,
  DiskSpaceCheck,
  MemoryHeapCheck,
  MemoryRSSCheck,
} from '@adonisjs/core/health';
import { DbCheck, DbConnectionCountCheck } from '@adonisjs/lucid/database';
import db from '@adonisjs/lucid/services/db';
import { RedisCheck } from '@adonisjs/redis';
import redis from '@adonisjs/redis/services/main';

import { StorageCheck } from '#core/health_checks/storage_check';

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck().cacheFor('1 hour'),
  new MemoryHeapCheck(),
  new MemoryRSSCheck(),
  new DbCheck(db.connection()),
  // Counts every backend on the server (pg_stat_activity), not just this app's pool, so the
  // thresholds sit below Postgres' default max_connections of 100.
  new DbConnectionCountCheck(db.connection())
    .warnWhenExceeds(70)
    .failWhenExceeds(90),
  new StorageCheck(),
  new RedisCheck(redis.connection()),
]);
