import type { ApiClient } from '@japa/api-client';

import PermissionGrant from '#access/models/permission_grant';
import PlatformAdmin from '#access/models/platform_admin';
import Role from '#access/models/role';
import RoleAssignment from '#access/models/role_assignment';
import Tenant from '#tenancy/models/tenant';
import { runInTenant } from '#tenancy/tenant_context';
import User from '#users/models/user';

let users = 0;

function user() {
  users += 1;

  return User.create({
    email: `user${users}@example.com`,
    password: 'password123',
  });
}

/** A signed-up user who hasn't joined any tenant yet, e.g. to accept an invitation. */
export const createUser = user;

export function makePlatformAdmin(holder: User) {
  return PlatformAdmin.create({ userId: holder.id });
}

/** A tenant to act in, the headers that select it, and its roles, grants and members. */
export async function workspace(name = 'Acme') {
  const tenant = await Tenant.create({ name });
  const inside = <T>(fn: () => Promise<T>) => runInTenant(tenant.id, fn);

  return {
    tenant,
    inside,
    headers: { 'X-Tenant-Id': tenant.id },
    role: (roleName: string, permissions: string[]) =>
      inside(() => Role.create({ name: roleName, permissions })),
    assign: (holder: User, role: Role) =>
      inside(() =>
        RoleAssignment.create({ userId: holder.id, roleId: role.id })
      ),
    grant: (holder: User, permission: string) =>
      inside(() => PermissionGrant.create({ userId: holder.id, permission })),
    async member() {
      const joined = await user();
      await tenant.related('memberships').create({ userId: joined.id });

      return joined;
    },
  };
}

export type Workspace = Awaited<ReturnType<typeof workspace>>;

/** Acme, with a first member who holds its Owner role: `roles.manage` and `members.manage`. */
export async function ownedWorkspace() {
  const acme = await workspace();
  const owner = await acme.member();
  const ownerRole = await acme.role('Owner', [
    'roles.manage',
    'members.manage',
  ]);
  await acme.assign(owner, ownerRole);

  return { acme, owner, ownerRole };
}

/** What `GET /api/v1/access/me` answers `user` in the tenant `headers` select. */
export async function permissionsOf(
  client: ApiClient,
  user: User,
  headers: Record<string, string>
) {
  const response = await client
    .visit('access.my_permissions.show')
    .headers(headers)
    .loginAs(user);

  response.assertStatus(200);

  return response.body().data.permissions;
}
