import type { TenantEvent } from '#core/audit/types'

declare module '#core/audit/types' {
  interface AuditEvents {
    'tenant.created': TenantEvent<'tenant', { name: string }>
  }
}
