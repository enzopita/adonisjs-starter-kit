import db from '@adonisjs/lucid/services/db';

import InvalidPasswordException from '#auth/exceptions/invalid_password_exception';
import InvalidTwoFactorCodeException from '#auth/exceptions/invalid_two_factor_code_exception';
import TwoFactorNotEnabledException from '#auth/exceptions/two_factor_not_enabled_exception';
import {
  replaceRecoveryCodes,
  verifySecondFactor,
} from '#auth/services/two_factor';
import type {} from '#auth/types/audit';
import { audit } from '#core/audit/main';
import User from '#users/models/user';

export interface RegenerateRecoveryCodesInput {
  user: User;
  password: string;
  code: string;
}

/** Replaces every recovery code, used or not, and returns the new ones in clear, once. */
export default class RegenerateRecoveryCodes {
  async handle({ user, password, code }: RegenerateRecoveryCodesInput) {
    if (!(await user.verifyPassword(password)))
      throw new InvalidPasswordException();

    return db.transaction(async (trx) => {
      const locked = await User.query({ client: trx })
        .where('id', user.id)
        .forUpdate()
        .firstOrFail();

      if (!locked.twoFactorConfirmedAt)
        throw new TwoFactorNotEnabledException();

      if (!(await verifySecondFactor(trx, locked, { type: 'totp', code }))) {
        throw new InvalidTwoFactorCodeException();
      }

      const recoveryCodes = await replaceRecoveryCodes(trx, locked.id);

      await audit.record(trx, 'auth.recovery_codes_regenerated', {
        tenantId: null,
        subject: { type: 'user', id: locked.id },
        data: { email: locked.email },
      });

      return recoveryCodes;
    });
  }
}
