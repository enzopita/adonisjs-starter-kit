import type { AccountEvent, SystemEvent, TenantEvent } from '#core/audit/types'

declare module '#core/audit/types' {
  interface AuditEvents {
    'admin.tenant_renamed': TenantEvent<'tenant', { from: string; to: string }>
    'admin.tenant_suspended': TenantEvent<'tenant', { name: string }>
    'admin.tenant_reactivated': TenantEvent<'tenant', { name: string }>
    'admin.user_disabled': AccountEvent<'user', { email: string }>
    'admin.user_enabled': AccountEvent<'user', { email: string }>
    'admin.impersonation_started': AccountEvent<'user', { email: string }>
    'admin.granted': SystemEvent<{ email: string }>
  }
}
