import db from '@adonisjs/lucid/services/db';

import InvalidPasswordException from '#auth/exceptions/invalid_password_exception';
import InvalidTwoFactorCodeException from '#auth/exceptions/invalid_two_factor_code_exception';
import TwoFactorNotEnabledException from '#auth/exceptions/two_factor_not_enabled_exception';
import {
  clearTwoFactor,
  verifySecondFactor,
  type SecondFactor,
} from '#auth/services/two_factor';
import type {} from '#auth/types/audit';
import { audit } from '#core/audit/main';
import User from '#users/models/user';

export interface DisableTwoFactorInput {
  user: User;
  password: string;
  factor: SecondFactor;
}

/** Needs the password and a current second factor, so a stolen session alone can't turn it off. */
export default class DisableTwoFactor {
  async handle({ user, password, factor }: DisableTwoFactorInput) {
    // Before the lock: hashing is slow and needs no row.
    if (!(await user.verifyPassword(password)))
      throw new InvalidPasswordException();

    await db.transaction(async (trx) => {
      const locked = await User.query({ client: trx })
        .where('id', user.id)
        .forUpdate()
        .firstOrFail();

      if (!locked.twoFactorConfirmedAt)
        throw new TwoFactorNotEnabledException();

      if (!(await verifySecondFactor(trx, locked, factor))) {
        throw new InvalidTwoFactorCodeException();
      }

      await clearTwoFactor(trx, locked);

      await audit.record(trx, 'auth.two_factor_disabled', {
        tenantId: null,
        subject: { type: 'user', id: locked.id },
        data: { email: locked.email },
      });
    });
  }
}
