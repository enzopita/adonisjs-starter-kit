import type { AccountEvent } from '#core/audit/types'

declare module '#core/audit/types' {
  interface AuditEvents {
    'auth.signed_up': AccountEvent<'user', { email: string; fullName: string | null }>
    'auth.logged_in': AccountEvent<'user', { email: string }>
    'auth.login_failed': AccountEvent<null, { email: string }>
    'auth.logged_out': AccountEvent<'user', { email: string }>
  }
}
