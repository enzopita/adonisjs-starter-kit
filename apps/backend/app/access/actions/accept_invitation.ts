import db from '@adonisjs/lucid/services/db';
import { DateTime } from 'luxon';

import InvitationEmailMismatchException from '#access/exceptions/invitation_email_mismatch_exception';
import InvitationNotFoundException from '#access/exceptions/invitation_not_found_exception';
import Invitation from '#access/models/invitation';
import Role from '#access/models/role';
import RoleAssignment from '#access/models/role_assignment';
import GetMember from '#access/queries/get_member';
import { roleSnapshot } from '#access/snapshots';
import type {} from '#access/types/audit';
import { audit } from '#core/audit/main';
import { hashToken } from '#core/tokens';
import TenantMembership from '#tenancy/models/tenant_membership';
import { runAsSystem, runInTenant } from '#tenancy/tenant_context';
import User from '#users/models/user';

export interface AcceptInvitationInput {
  token: string;
  userId: string;
  userEmail: string;
}

export default class AcceptInvitation {
  /** Returns the id of the tenant the invitation grants access to. */
  async handle({
    token,
    userId,
    userEmail,
  }: AcceptInvitationInput): Promise<string> {
    const invitation = await runAsSystem(() =>
      Invitation.query().where('token_hash', hashToken(token)).first()
    );

    if (!invitation || invitation.expiresAt < DateTime.now()) {
      throw new InvitationNotFoundException();
    }

    if (invitation.email !== userEmail)
      throw new InvitationEmailMismatchException();

    const { tenantId, roleId } = invitation;

    await runInTenant(tenantId, () =>
      db.transaction(async (trx) => {
        const membership = await TenantMembership.query({ client: trx })
          .where('tenant_id', tenantId)
          .where('user_id', userId)
          .first();

        const role = roleSnapshot(
          roleId ? await Role.findOrFail(roleId, { client: trx }) : null
        );

        // Already a member: the invitation is spent and nothing else changes. Makes a retry
        // after a crash between the membership write and this delete safe to repeat.
        if (!membership) {
          await TenantMembership.create({ tenantId, userId }, { client: trx });

          if (roleId)
            await RoleAssignment.create(
              { tenantId, userId, roleId },
              { client: trx }
            );

          await audit.record(trx, 'member.joined', {
            tenantId,
            subject: { type: 'member', id: userId },
            data: {
              member: await new GetMember().handle(trx, { tenantId, userId }),
              role,
            },
          });
        }

        // The invitation's link reached this inbox, which is what verifying the email proves.
        await User.query({ client: trx })
          .where('id', userId)
          .whereNull('email_verified_at')
          .update({ email_verified_at: new Date() });

        await invitation.useTransaction(trx).delete();

        await audit.record(trx, 'invitation.accepted', {
          tenantId,
          subject: { type: 'invitation', id: invitation.id },
          data: { email: invitation.email, role },
        });
      })
    );

    return tenantId;
  }
}
