import User from '#users/models/user'
import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#admin/types/audit'
import { grantPlatformAdmin } from '#admin/services/grant_platform_admin'

export interface GrantPlatformAdminInput {
  email: string
}

export default class GrantPlatformAdmin {
  /** Null for an unknown email. A user who already is an admin is left as is, with no event. */
  async handle({ email }: GrantPlatformAdminInput) {
    const user = await User.findBy('email', email.toLowerCase())

    if (!user) return null

    return db.transaction(async trx => {
      const granted = await grantPlatformAdmin(user.id, trx)

      if (granted) {
        await audit.record(trx, 'admin.granted', {
          tenantId: null,
          subject: null,
          data: { email: user.email },
        })
      }

      return { user, granted }
    })
  }
}
