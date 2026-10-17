import { AsyncLocalStorage } from 'node:async_hooks'
import type { HttpContext } from '@adonisjs/core/http'

export type AuditScope = { ctx: HttpContext; recorded: number }

const storage = new AsyncLocalStorage<AuditScope>()

export function runInAuditScope<T>(scope: AuditScope, fn: () => T): T {
  return storage.run(scope, fn)
}

/** Undefined outside a request (repl, seeds, jobs): events recorded there have no origin. */
export function currentAuditScope(): AuditScope | undefined {
  return storage.getStore()
}
