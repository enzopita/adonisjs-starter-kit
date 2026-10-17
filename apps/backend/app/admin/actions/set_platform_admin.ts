import User from '#users/models/user'
import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#admin/types/audit'
import PlatformAdmin from '#access/models/platform_admin'
import { grantPlatformAdmin } from '#admin/services/grant_platform_admin'
import CannotRevokeSelfException from '#admin/exceptions/cannot_revoke_self_exception'

export interface SetPlatformAdminInput {
  id: string
  platformAdmin: boolean
  actorId: string
}

export default class SetPlatformAdmin {
  /** The caller is an admin and can't revoke themself, so at least one admin always remains. */
  async handle({ id, platformAdmin, actorId }: SetPlatformAdminInput) {
    if (!platformAdmin && id === actorId) throw new CannotRevokeSelfException()

    return db.transaction(async trx => {
      const user = await User.findOrFail(id, { client: trx })

      if (platformAdmin) {
        await grantPlatformAdmin(user.id, trx)
      } else {
        await PlatformAdmin.query({ client: trx }).where('userId', user.id).delete()
      }

      await audit.record(
        trx,
        platformAdmin ? 'admin.platform_admin_granted' : 'admin.platform_admin_revoked',
        {
          tenantId: null,
          subject: { type: 'user', id: user.id },
          data: { email: user.email },
        },
      )

      return user
    })
  }
}
