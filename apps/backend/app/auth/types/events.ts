/** The raw token travels only to the listener that mails it. `locale` is the request’s. */
export interface UserTokenMailed {
  email: string;
  token: string;
  locale: string;
}

declare module '@adonisjs/core/types' {
  interface EventsList {
    'auth:password_reset_requested': UserTokenMailed;
    'auth:email_verification_requested': UserTokenMailed;
  }
}
