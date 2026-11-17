import db from '@adonisjs/lucid/services/db';

import { audit, dirtyChanges } from '#core/audit/main';
import type User from '#users/models/user';
import type {} from '#users/types/audit';

export interface UpdateProfileInput {
  user: User;
  /** `undefined` leaves the field as is; a stored field is never cleared back to null. */
  locale?: string;
  timezone?: string;
}

export default class UpdateProfile {
  async handle({ user, locale, timezone }: UpdateProfileInput) {
    return await db.transaction(async (trx) => {
      user.useTransaction(trx);

      if (locale !== undefined) {
        user.locale = locale;
      }

      if (timezone !== undefined) {
        user.timezone = timezone;
      }

      const changes = dirtyChanges(user, ['locale', 'timezone']);
      await user.save();

      await audit.record(trx, 'user.profile_updated', {
        tenantId: null,
        subject: { type: 'user', id: user.id },
        data: { changes },
      });

      return user;
    });
  }
}
