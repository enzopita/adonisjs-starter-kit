import type { AccountEvent, SystemEvent } from '#core/audit/types';

declare module '#core/audit/types' {
  interface AuditEvents {
    'auth.signed_up': AccountEvent<
      'user',
      { email: string; fullName: string | null }
    >;
    // `factor` is the second factor used, absent for a sign-in without two-factor authentication.
    'auth.logged_in': AccountEvent<
      'user',
      { email: string; factor?: 'totp' | 'recovery_code' }
    >;
    // The subject is the account the email belongs to, if any, so its owner sees the attempt.
    'auth.login_failed': AccountEvent<'user' | null, { email: string }>;
    // The password was right, but an admin two-factor reset holds sign-in until it's changed.
    'auth.password_reset_required': AccountEvent<'user', { email: string }>;
    'auth.logged_out': AccountEvent<'user', { email: string }>;
    'auth.session_revoked': AccountEvent<'user', { email: string }>;
    // Recorded for any email, like a failed login: the subject is its account, if any.
    'auth.password_reset_requested': AccountEvent<
      'user' | null,
      { email: string }
    >;
    'auth.password_reset': AccountEvent<'user', { email: string }>;
    'auth.email_verification_requested': AccountEvent<
      'user',
      { email: string }
    >;
    'auth.email_verified': AccountEvent<'user', { email: string }>;
    // The password was right and a second factor was asked for: a sign-in isn't done yet.
    'auth.two_factor_challenged': AccountEvent<'user', { email: string }>;
    'auth.two_factor_failed': AccountEvent<'user', { email: string }>;
    'auth.recovery_code_used': AccountEvent<
      'user',
      { email: string; remaining: number }
    >;
    'auth.two_factor_enrollment_started': AccountEvent<
      'user',
      { email: string }
    >;
    'auth.two_factor_enabled': AccountEvent<'user', { email: string }>;
    'auth.two_factor_disabled': AccountEvent<'user', { email: string }>;
    'auth.recovery_codes_regenerated': AccountEvent<'user', { email: string }>;
    'auth.tokens_pruned': SystemEvent<{
      accessTokens: number;
      userTokens: number;
    }>;
  }
}
