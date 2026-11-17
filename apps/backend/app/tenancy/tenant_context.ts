import { AsyncLocalStorage } from 'node:async_hooks';

import MissingTenantContextException from '#tenancy/exceptions/missing_tenant_context_exception';

export type TenantContext =
  | { kind: 'tenant'; tenantId: string }
  | { kind: 'system' };

const storage = new AsyncLocalStorage<TenantContext>();

/** Runs `fn` with every tenant-scoped query restricted to `tenantId`. */
export function runInTenant<T>(tenantId: string, fn: () => T): T {
  return storage.run({ kind: 'tenant', tenantId }, fn);
}

/**
 * Runs `fn` with tenant-scoped queries unrestricted, for work that spans
 * tenants. Await every query inside `fn`: Lucid builders are thenables, so
 * `runAsSystem(() => Post.query())` returns a builder the caller's `await`
 * runs outside this context, where it throws or sees only the caller's tenant.
 */
export function runAsSystem<T>(fn: () => T): T {
  return storage.run({ kind: 'system' }, fn);
}

/** Throws outside runInTenant() and runAsSystem(): a missing context never means unscoped. */
export function currentTenantContext(): TenantContext {
  const context = storage.getStore();

  if (!context) throw new MissingTenantContextException();

  return context;
}

/**
 * The current tenant id, or null in runAsSystem() and outside any context. Never throws,
 * so it can't scope tenant queries: it is for authorization, which denies outside a tenant.
 */
export function currentTenantId(): string | null {
  const context = storage.getStore();

  return context?.kind === 'tenant' ? context.tenantId : null;
}
