import User from '#users/models/user'
import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#admin/types/audit'
import UserDisabledException from '#admin/exceptions/user_disabled_exception'
import { ensureNotPlatformAdmin } from '#admin/services/protect_platform_admins'

export interface ImpersonateUserInput {
  id: string
  impersonatorId: string
}

export default class ImpersonateUser {
  async handle({ id, impersonatorId }: ImpersonateUserInput) {
    const user = await User.findOrFail(id)
    await ensureNotPlatformAdmin(user.id)

    if (user.disabledAt) throw new UserDisabledException()

    // The provider inserts outside any transaction. A crash before the update below leaves an
    // unmarked token whose secret was never returned to anyone, so nobody can use it.
    const token = await User.accessTokens.create(user, ['*'], {
      name: 'impersonation',
      expiresIn: '1 hour',
    })

    await db.transaction(async trx => {
      await trx
        .from('auth_access_tokens')
        .where('id', String(token.identifier))
        .update({ impersonator_id: impersonatorId })

      await audit.record(trx, 'admin.impersonation_started', {
        tenantId: null,
        subject: { type: 'user', id: user.id },
        data: { email: user.email },
      })
    })

    return { user, token }
  }
}
