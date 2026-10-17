import { DateTime } from 'luxon'
import User from '#users/models/user'
import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#admin/types/audit'
import { ensureNotPlatformAdmin } from '#admin/services/protect_platform_admins'

export interface SetUserDisabledInput {
  id: string
  disabled: boolean
}

export default class SetUserDisabled {
  /**
   * Disabling signs the user out everywhere by deleting their tokens, so no request has to check
   * `disabledAt`. Enabling isn't protected: someone disabled before becoming a platform admin
   * can still be enabled.
   */
  async handle({ id, disabled }: SetUserDisabledInput) {
    return db.transaction(async trx => {
      const user = await User.findOrFail(id, { client: trx })

      if (disabled) {
        await ensureNotPlatformAdmin(user.id, trx)
        await trx.from('auth_access_tokens').where('tokenable_id', user.id).delete()
      }

      user.disabledAt = disabled ? (user.disabledAt ?? DateTime.now()) : null
      await user.save()

      await audit.record(trx, disabled ? 'admin.user_disabled' : 'admin.user_enabled', {
        tenantId: null,
        subject: { type: 'user', id: user.id },
        data: { email: user.email },
      })

      return user
    })
  }
}
