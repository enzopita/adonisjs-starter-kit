import Role from '#access/models/role'
import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#access/types/audit'
import Invitation from '#access/models/invitation'

export interface RevokeInvitationInput {
  tenantId: string
  id: string
}

export default class RevokeInvitation {
  async handle({ tenantId, id }: RevokeInvitationInput) {
    const invitation = await Invitation.findOrFail(id)

    await db.transaction(async trx => {
      const role = invitation.roleId
        ? await Role.findOrFail(invitation.roleId, { client: trx })
        : null

      await invitation.useTransaction(trx).delete()

      await audit.record(trx, 'invitation.revoked', {
        tenantId,
        subject: { type: 'invitation', id: invitation.id },
        data: { email: invitation.email, role: role && { id: role.id, name: role.name } },
      })
    })
  }
}
