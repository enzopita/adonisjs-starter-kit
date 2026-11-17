export interface MemberInvited {
  email: string;
  token: string;
  /** The recipient's stored locale when they already have an account, else the inviter's. */
  locale: string;
}

declare module '@adonisjs/core/types' {
  interface EventsList {
    'access:member_invited': MemberInvited;
  }
}
