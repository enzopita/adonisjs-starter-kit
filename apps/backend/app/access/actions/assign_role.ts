import db from '@adonisjs/lucid/services/db';

import Role from '#access/models/role';
import RoleAssignment from '#access/models/role_assignment';
import GetMember from '#access/queries/get_member';
import { KeepAManager } from '#access/services/keep_a_manager';
import { roleSnapshot } from '#access/snapshots';
import type {} from '#access/types/audit';
import { audit } from '#core/audit/main';

export interface AssignRoleInput {
  tenantId: string;
  userId: string;
  roleId: string | null;
}

export default class AssignRole {
  /** Replaces the member's role in the tenant; null leaves them without one. */
  async handle({ tenantId, userId, roleId }: AssignRoleInput) {
    await db.transaction((trx) =>
      new KeepAManager().handle(trx, tenantId, async () => {
        const member = await new GetMember().handle(trx, { tenantId, userId });

        const previous = await RoleAssignment.query({ client: trx })
          .where('user_id', userId)
          .first();

        const from = previous
          ? await Role.findOrFail(previous.roleId, { client: trx })
          : null;
        const to = roleId
          ? await Role.findOrFail(roleId, { client: trx })
          : null;

        await RoleAssignment.query({ client: trx })
          .where('user_id', userId)
          .delete();

        if (roleId)
          await RoleAssignment.create({ userId, roleId }, { client: trx });

        await audit.record(trx, 'member.role_changed', {
          tenantId,
          subject: { type: 'member', id: userId },
          data: {
            member,
            from: roleSnapshot(from),
            to: roleSnapshot(to),
          },
        });
      })
    );
  }
}
