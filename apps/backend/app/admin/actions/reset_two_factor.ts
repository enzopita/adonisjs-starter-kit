import emitter from '@adonisjs/core/services/emitter';
import db from '@adonisjs/lucid/services/db';
import { DateTime } from 'luxon';

import UserDisabledException from '#admin/exceptions/user_disabled_exception';
import { ensureNotPlatformAdmin } from '#admin/services/protect_platform_admins';
import type {} from '#admin/types/audit';
import type {} from '#admin/types/events';
import TwoFactorNotEnabledException from '#auth/exceptions/two_factor_not_enabled_exception';
import { clearTwoFactor } from '#auth/services/two_factor';
import { issueUserToken } from '#auth/services/user_tokens';
import { audit } from '#core/audit/main';
import User from '#users/models/user';
import { mailLocaleFor } from '#users/services/mail_locale';

export interface ResetTwoFactorInput {
  id: string;
  /** False only for `node ace admin:reset-two-factor`, the operator's way to reset an admin. */
  protectPlatformAdmins: boolean;
}

export default class ResetTwoFactor {
  /**
   * Turns off the two-factor of a user who lost their device. Not idempotent: a repeat would mail
   * the user again about a reset that didn't happen. Signs the user out everywhere, so a session
   * on the lost device stops working too, and holds their sign-in until they choose a new password
   * through the mailed link: someone with only a phished password can't get in by claiming a lost
   * device.
   */
  async handle({ id, protectPlatformAdmins }: ResetTwoFactorInput) {
    const { user, revoked, token } = await db.transaction(async (trx) => {
      const locked = await User.query({ client: trx })
        .where('id', id)
        .forUpdate()
        .firstOrFail();

      if (protectPlatformAdmins) {
        await ensureNotPlatformAdmin(locked.id, trx);
      }

      if (locked.disabledAt) {
        throw new UserDisabledException();
      }

      if (!locked.twoFactorConfirmedAt) {
        throw new TwoFactorNotEnabledException();
      }

      await clearTwoFactor(trx, locked);

      locked.passwordResetRequiredAt = DateTime.now();
      await locked.save();

      const issued = await issueUserToken(trx, locked.id, 'password_reset');

      // In the same transaction, so a failure can't leave 2FA off with the lost device signed in,
      // where a retry would stop at "not enabled". Impersonation sessions are the admin's.
      const deleted = await trx
        .from('auth_access_tokens')
        .where('tokenable_id', locked.id)
        .whereNull('impersonator_id')
        .delete();

      await audit.record(trx, 'admin.two_factor_reset', {
        tenantId: null,
        subject: { type: 'user', id: locked.id },
        data: { email: locked.email },
      });

      return { user: locked, revoked: Number(deleted), token: issued };
    });

    await emitter.emit('admin:two_factor_reset', {
      email: user.email,
      token,
      locale: mailLocaleFor(user),
    });

    return { user, revoked };
  }
}
