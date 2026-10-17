import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import Role from '#access/models/role'
import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#access/types/audit'
import GetMember from '#access/queries/get_member'
import Invitation from '#access/models/invitation'
import RoleAssignment from '#access/models/role_assignment'
import TenantMembership from '#tenancy/models/tenant_membership'
import { runAsSystem, runInTenant } from '#tenancy/tenant_context'
import InvitationNotFoundException from '#access/exceptions/invitation_not_found_exception'
import InvitationEmailMismatchException from '#access/exceptions/invitation_email_mismatch_exception'

export interface AcceptInvitationInput {
  token: string
  userId: string
  userEmail: string
}

export default class AcceptInvitation {
  /** Returns the id of the tenant the invitation grants access to. */
  async handle({ token, userId, userEmail }: AcceptInvitationInput): Promise<string> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const invitation = await runAsSystem(() =>
      Invitation.query().where('token_hash', tokenHash).first(),
    )

    if (!invitation || invitation.expiresAt < DateTime.now()) {
      throw new InvitationNotFoundException()
    }

    if (invitation.email !== userEmail) throw new InvitationEmailMismatchException()

    const { tenantId, roleId } = invitation

    await runInTenant(tenantId, () =>
      db.transaction(async trx => {
        const membership = await TenantMembership.query({ client: trx })
          .where('tenant_id', tenantId)
          .where('user_id', userId)
          .first()

        // Already a member: the invitation is spent and nothing else changes. Makes a retry
        // after a crash between the membership write and this delete safe to repeat.
        const found = roleId ? await Role.findOrFail(roleId, { client: trx }) : null
        const role = found && { id: found.id, name: found.name }

        if (!membership) {
          await TenantMembership.create({ tenantId, userId }, { client: trx })

          if (roleId) await RoleAssignment.create({ tenantId, userId, roleId }, { client: trx })

          await audit.record(trx, 'member.joined', {
            tenantId,
            subject: { type: 'member', id: userId },
            data: { member: await new GetMember().handle(trx, { tenantId, userId }), role },
          })
        }

        await invitation.useTransaction(trx).delete()

        await audit.record(trx, 'invitation.accepted', {
          tenantId,
          subject: { type: 'invitation', id: invitation.id },
          data: { email: invitation.email, role },
        })
      }),
    )

    return tenantId
  }
}
