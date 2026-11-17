import db from '@adonisjs/lucid/services/db';

import { isAssignable, type Permission } from '#access/permissions';
import User from '#users/models/user';

export interface ListMembersInput {
  tenantId: string;
}

export interface MemberRow {
  user: User;
  roleId: string | null;
  permissions: Permission[];
}

/** TenantMembership isn't tenant-scoped (see docs/architecture.md), so every query here filters tenant_id explicitly. */
export default class ListMembers {
  async handle({ tenantId }: ListMembersInput): Promise<MemberRow[]> {
    const memberships: { userId: string }[] = await db
      .from('tenant_memberships')
      .where('tenant_id', tenantId)
      .select('user_id as userId');

    const userIds = memberships.map((row) => row.userId);

    const users = await User.query()
      .whereIn('id', userIds)
      .preload('avatar')
      .orderByRaw('coalesce(full_name, email)');

    const roleAssignments: { userId: string; roleId: string }[] = await db
      .from('role_assignments')
      .where('tenant_id', tenantId)
      .select('user_id as userId', 'role_id as roleId');

    const roleByUser = new Map(
      roleAssignments.map((row) => [row.userId, row.roleId])
    );

    const grants: { userId: string; permission: string }[] = await db
      .from('permission_grants')
      .where('tenant_id', tenantId)
      .select('user_id as userId', 'permission');

    const permissionsByUser = new Map<string, Permission[]>();

    for (const { userId, permission } of grants) {
      if (!isAssignable(permission)) continue;

      const list = permissionsByUser.get(userId);

      if (list) list.push(permission);
      else permissionsByUser.set(userId, [permission]);
    }

    return users.map((user) => ({
      user,
      roleId: roleByUser.get(user.id) ?? null,
      permissions: permissionsByUser.get(user.id) ?? [],
    }));
  }
}
