import db from '@adonisjs/lucid/services/db';

import Role from '#access/models/role';
import type { Permission } from '#access/permissions';
import type {} from '#access/types/audit';
import { audit } from '#core/audit/main';

export interface CreateRoleInput {
  tenantId: string;
  name: string;
  permissions: Permission[];
}

export default class CreateRole {
  async handle({ tenantId, name, permissions }: CreateRoleInput) {
    return await db.transaction(async (trx) => {
      const role = await Role.create({ name, permissions }, { client: trx });

      await audit.record(trx, 'role.created', {
        tenantId,
        subject: { type: 'role', id: role.id },
        data: { name, permissions },
      });

      return role;
    });
  }
}
