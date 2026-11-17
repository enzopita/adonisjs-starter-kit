import db from '@adonisjs/lucid/services/db';

import Invitation from '#access/models/invitation';
import Role from '#access/models/role';
import { roleSnapshot } from '#access/snapshots';
import type {} from '#access/types/audit';
import { audit } from '#core/audit/main';

export interface RevokeInvitationInput {
  tenantId: string;
  id: string;
}

export default class RevokeInvitation {
  async handle({ tenantId, id }: RevokeInvitationInput) {
    const invitation = await Invitation.findOrFail(id);

    await db.transaction(async (trx) => {
      const role =
        invitation.roleId === null
          ? null
          : await Role.findOrFail(invitation.roleId, { client: trx });

      await invitation.useTransaction(trx).delete();

      await audit.record(trx, 'invitation.revoked', {
        tenantId,
        subject: { type: 'invitation', id: invitation.id },
        data: { email: invitation.email, role: roleSnapshot(role) },
      });
    });
  }
}
