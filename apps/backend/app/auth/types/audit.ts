import type { AccountEvent } from '#core/audit/types'

declare module '#core/audit/types' {
  interface AuditEvents {
    'auth.signed_up': AccountEvent<'user', { email: string; fullName: string | null }>
    'auth.logged_in': AccountEvent<'user', { email: string }>
    // The subject is the account the email belongs to, if any, so its owner sees the attempt.
    'auth.login_failed': AccountEvent<'user' | null, { email: string }>
    'auth.logged_out': AccountEvent<'user', { email: string }>
  }
}
