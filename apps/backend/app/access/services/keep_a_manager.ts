import type { TransactionClientContract } from '@adonisjs/lucid/types/database';

import LastManagerException from '#access/exceptions/last_manager_exception';
import { PERMISSIONS } from '#access/permissions';

async function hasManager(trx: TransactionClientContract, tenantId: string) {
  const viaRole = trx
    .from('role_assignments')
    .join('roles', 'roles.id', 'role_assignments.role_id')
    .where('role_assignments.tenant_id', tenantId)
    .whereRaw('? = ANY(roles.permissions)', [PERMISSIONS.membersManage])
    .select(trx.raw('1'));

  const viaGrant = trx
    .from('permission_grants')
    .where('tenant_id', tenantId)
    .where('permission', PERMISSIONS.membersManage)
    .select(trx.raw('1'));

  const rows: unknown[] = await viaRole.unionAll(viaGrant).limit(1);

  return rows.length > 0;
}

export class KeepAManager {
  /**
   * Runs `write` in `trx` and throws (rolling it back) when it leaves the tenant with no one
   * able to manage members while someone could before; a tenant nobody manages yet can still
   * be set up. Writes to a tenant are serialized, so two managers can't demote each other at
   * once.
   */
  async handle<T>(
    trx: TransactionClientContract,
    tenantId: string,
    write: () => Promise<T>
  ) {
    await trx.rawQuery('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', [
      `access:${tenantId}`,
    ]);

    const before = await hasManager(trx, tenantId);
    const result = await write();

    if (before && !(await hasManager(trx, tenantId)))
      throw new LastManagerException();

    return result;
  }
}
