import { authApiClient } from '@adonisjs/auth/plugins/api_client';
import app from '@adonisjs/core/services/app';
import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { dbAssertions } from '@adonisjs/lucid/plugins/db';
import { apiClient } from '@japa/api-client';
import { assert } from '@japa/assert';
import { pluginAdonisJS } from '@japa/plugin-adonisjs';
import type { Config } from '@japa/runner/types';

import type { Registry } from '../.adonisjs/client/registry/schema.d.ts';

declare module '@japa/api-client/types' {
  interface RoutesRegistry extends Registry {}
}

export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  dbAssertions(app),
  apiClient(),
  authApiClient(app),
];

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [() => testUtils.db().migrate()],
  teardown: [],
};

export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    suite.setup(() => testUtils.httpServer().start());
    // Throttle keys live outside the per-test db transaction, so every test starts unblocked.
    suite.onGroup((group) => {
      group.each.setup(() => () => limiter.clear(['memory']));
    });
  }
};
