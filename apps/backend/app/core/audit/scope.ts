import { AsyncLocalStorage } from 'node:async_hooks';

import type { HttpContext } from '@adonisjs/core/http';

/** Why a route records no event. A new reason is a reviewed edit here, not a string at the route. */
export type UnauditedReason = 'provider_callback';

export type AuditScope = {
  ctx: HttpContext;
  recorded: number;
  /** Set by the `unaudited` route middleware: a route that is no person's action. */
  unaudited?: UnauditedReason;
  /** Set by `audit.unchanged()`: this request found nothing to change. */
  unchanged?: true;
};

const storage = new AsyncLocalStorage<AuditScope>();

export function runInAuditScope<T>(scope: AuditScope, fn: () => T): T {
  return storage.run(scope, fn);
}

/** Undefined outside a request (repl, seeds, jobs): events recorded there have no origin. */
export function currentAuditScope(): AuditScope | undefined {
  return storage.getStore();
}
