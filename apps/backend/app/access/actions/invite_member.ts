import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import Role from '#access/models/role'
import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#access/types/audit'
import emitter from '@adonisjs/core/services/emitter'
import Invitation from '#access/models/invitation'
import type { MemberInvited } from '#access/types/events'
import AlreadyMemberException from '#access/exceptions/already_member_exception'

export interface InviteMemberInput {
  tenantId: string
  email: string
  roleId: string | null
  invitedById: string
  locale: string
}

export const EXPIRY = { days: 7 }

export default class InviteMember {
  /**
   * Upserts on (tenantId, email): re-inviting refreshes the token, role, inviter and expiry
   * instead of failing. Emits after commit, so the mail always points at a stored invitation.
   */
  async handle({ tenantId, email, roleId, invitedById, locale }: InviteMemberInput) {
    const alreadyMember = await db
      .from('tenant_memberships')
      .join('users', 'users.id', 'tenant_memberships.user_id')
      .where('tenant_memberships.tenant_id', tenantId)
      .where('users.email', email)
      .first()

    if (alreadyMember) throw new AlreadyMemberException()

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const invitation = await db.transaction(async trx => {
      const upserted = await Invitation.updateOrCreate(
        { tenantId, email },
        { roleId, tokenHash, invitedById, expiresAt: DateTime.now().plus(EXPIRY) },
        { client: trx },
      )

      const role = roleId ? await Role.findOrFail(roleId, { client: trx }) : null

      await audit.record(trx, 'invitation.sent', {
        tenantId,
        subject: { type: 'invitation', id: upserted.id },
        data: { email, role: role && { id: role.id, name: role.name } },
      })

      return upserted
    })

    await emitter.emit('access:member_invited', {
      tenantId,
      email,
      token,
      locale,
    } satisfies MemberInvited)

    return invitation
  }
}
