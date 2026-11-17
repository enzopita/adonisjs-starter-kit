import db from '@adonisjs/lucid/services/db';
import { DateTime } from 'luxon';

import AccountDisabledException from '#auth/exceptions/account_disabled_exception';
import InvalidResetTokenException from '#auth/exceptions/invalid_reset_token_exception';
import { consumeUserToken } from '#auth/services/user_tokens';
import type {} from '#auth/types/audit';
import { audit } from '#core/audit/main';

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export default class ResetPassword {
  /** Returns the user, whose sessions the caller still has to revoke. */
  async handle({ token, password }: ResetPasswordInput) {
    return db.transaction(async (trx) => {
      const user = await consumeUserToken(trx, 'password_reset', token);

      if (!user) throw new InvalidResetTokenException();

      if (user.disabledAt) throw new AccountDisabledException();

      const subject = { type: 'user', id: user.id } as const;
      const entry = {
        tenantId: null,
        subject,
        actorId: user.id,
        data: { email: user.email },
      };

      user.password = password;
      user.passwordResetRequiredAt = null;

      // The link reached the inbox, which is what verifying the email proves.
      const verifies = !user.emailVerifiedAt;

      if (verifies) user.emailVerifiedAt = DateTime.now();

      await user.save();

      await audit.record(trx, 'auth.password_reset', entry);

      if (verifies) await audit.record(trx, 'auth.email_verified', entry);

      return user;
    });
  }
}
