import app from '@adonisjs/core/services/app';
import { defineConfig } from '@adonisjs/cors';

import env from '#start/env';

const corsConfig = defineConfig({
  /**
   * In development, allow every origin to simplify local front/backend setup.
   * Elsewhere, only the comma-separated CORS_ORIGIN allowlist (none when unset).
   */
  origin: app.inDev ? true : (env.get('CORS_ORIGIN') ?? []),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
});

export default corsConfig;
