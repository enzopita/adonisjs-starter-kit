import type { TenantEvent } from '#core/audit/types'

declare module '#core/audit/types' {
  interface AuditEvents {
    'tenant.created': TenantEvent<'tenant', { name: string }>
    // A signed-in user who isn't a member sent this tenant's id.
    'access.tenant_denied': TenantEvent<null, { route: string | null; method: string }>
  }
}
