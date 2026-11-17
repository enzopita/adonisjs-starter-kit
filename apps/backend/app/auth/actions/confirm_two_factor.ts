import db from '@adonisjs/lucid/services/db';
import { DateTime } from 'luxon';

import InvalidPasswordException from '#auth/exceptions/invalid_password_exception';
import InvalidTwoFactorCodeException from '#auth/exceptions/invalid_two_factor_code_exception';
import TwoFactorAlreadyEnabledException from '#auth/exceptions/two_factor_already_enabled_exception';
import TwoFactorNotStartedException from '#auth/exceptions/two_factor_not_started_exception';
import {
  replaceRecoveryCodes,
  verifySecondFactor,
} from '#auth/services/two_factor';
import type {} from '#auth/types/audit';
import { audit } from '#core/audit/main';
import User from '#users/models/user';

export interface ConfirmTwoFactorInput {
  user: User;
  password: string;
  code: string;
}

/**
 * Turns the pending secret on once a code of it proves the app holds it, and returns the recovery
 * codes in clear, the only time they are. The caller then revokes every other session. Needs the
 * password, so a stolen session alone can't enroll its own app and lock the owner out.
 */
export default class ConfirmTwoFactor {
  async handle({ user, password, code }: ConfirmTwoFactorInput) {
    if (!(await user.verifyPassword(password))) {
      throw new InvalidPasswordException();
    }

    return await db.transaction(async (trx) => {
      const locked = await User.query({ client: trx })
        .where('id', user.id)
        .forUpdate()
        .firstOrFail();

      if (locked.twoFactorConfirmedAt) {
        throw new TwoFactorAlreadyEnabledException();
      }

      if (locked.twoFactorSecret === null) {
        throw new TwoFactorNotStartedException();
      }

      if (!(await verifySecondFactor(trx, locked, { type: 'totp', code }))) {
        throw new InvalidTwoFactorCodeException();
      }

      locked.twoFactorConfirmedAt = DateTime.now();
      await locked.save();

      const recoveryCodes = await replaceRecoveryCodes(trx, locked.id);

      await audit.record(trx, 'auth.two_factor_enabled', {
        tenantId: null,
        subject: { type: 'user', id: locked.id },
        data: { email: locked.email },
      });

      return recoveryCodes;
    });
  }
}
