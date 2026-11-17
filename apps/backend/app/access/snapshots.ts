import type Role from '#access/models/role';
import type { RoleSnapshot } from '#access/types/audit';

/** How an audit event shows a role: what it was called then, even after a rename or delete. */
export function roleSnapshot(role: Role | null): RoleSnapshot | null {
  return role && { id: role.id, name: role.name };
}
