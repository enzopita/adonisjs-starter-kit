import emitter from '@adonisjs/core/services/emitter';
import db from '@adonisjs/lucid/services/db';

import { issueUserToken } from '#auth/services/user_tokens';
import type {} from '#auth/types/audit';
import type {} from '#auth/types/events';
import { audit } from '#core/audit/main';
import type User from '#users/models/user';
import { mailLocaleFor } from '#users/services/mail_locale';

export interface ResendEmailVerificationInput {
  user: User;
  locale: string;
}

export default class ResendEmailVerification {
  /** Replaces the pending verification link with a new one; nothing to send once verified. */
  async handle({ user, locale }: ResendEmailVerificationInput) {
    const token = await db.transaction(async (trx) => {
      const issued = user.emailVerifiedAt
        ? null
        : await issueUserToken(trx, user.id, 'email_verification');

      await audit.record(trx, 'auth.email_verification_requested', {
        tenantId: null,
        subject: { type: 'user', id: user.id },
        data: { email: user.email },
      });

      return issued;
    });

    if (token) {
      await emitter.emit('auth:email_verification_requested', {
        email: user.email,
        token,
        locale: mailLocaleFor(user, locale),
      });
    }
  }
}
