export interface TwoFactorReset {
  email: string;
  /** The raw password reset token, for the mailed link only. */
  token: string;
  locale: string;
}

declare module '@adonisjs/core/types' {
  interface EventsList {
    'admin:two_factor_reset': TwoFactorReset;
  }
}
