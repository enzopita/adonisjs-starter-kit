import db from '@adonisjs/lucid/services/db';

import TwoFactorAlreadyEnabledException from '#auth/exceptions/two_factor_already_enabled_exception';
import { newTwoFactorSecret } from '#auth/services/two_factor';
import type {} from '#auth/types/audit';
import { audit } from '#core/audit/main';
import User from '#users/models/user';

export interface StartTwoFactorEnrollmentInput {
  user: User;
}

/**
 * Stores a pending secret, replacing any earlier pending one. It changes nothing about signing in
 * until it is confirmed with a code.
 */
export default class StartTwoFactorEnrollment {
  async handle({ user }: StartTwoFactorEnrollmentInput) {
    return db.transaction(async (trx) => {
      const locked = await User.query({ client: trx })
        .where('id', user.id)
        .forUpdate()
        .firstOrFail();

      if (locked.twoFactorConfirmedAt)
        throw new TwoFactorAlreadyEnabledException();

      const secret = newTwoFactorSecret(locked.email);

      locked.merge({
        twoFactorSecret: secret.encrypted,
        twoFactorLastStep: null,
      });
      await locked.save();

      await audit.record(trx, 'auth.two_factor_enrollment_started', {
        tenantId: null,
        subject: { type: 'user', id: locked.id },
        data: { email: locked.email },
      });

      return { secret: secret.base32, uri: secret.uri };
    });
  }
}
