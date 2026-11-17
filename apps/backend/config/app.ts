import { defineConfig } from '@adonisjs/core/http';
import app from '@adonisjs/core/services/app';
import proxyAddr from 'proxy-addr';

import env from '#start/env';

/** How many days an audit event is kept before the daily prune deletes it. */
export const auditRetentionDays = env.get('AUDIT_RETENTION_DAYS', 365);

export const http = defineConfig({
  generateRequestId: true,

  /**
   * Production runs behind Traefik on a private Docker network. Trusting only loopback would make
   * every visitor share Traefik's IP, and with it every per-IP throttle. Private ranges can't be
   * reached from outside, so a client can't forge its own address through X-Forwarded-For.
   */
  trustProxy: proxyAddr.compile(['loopback', 'uniquelocal']),

  allowMethodSpoofing: false,
  useAsyncLocalStorage: false,

  router: {
    matcher: 'tree',
  },

  redirect: {
    forwardQueryString: true,
  },

  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },
});
