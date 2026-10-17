import { PERMISSIONS, type Permission } from '#access/permissions'
import type { TenantSubjectType } from '#core/audit/types'

/**
 * Who may read one subject's trail without audit.view: the permission of the feature that owns
 * the subject. A feature that shows its records' history adds its subject type here.
 */
export const SUBJECT_PERMISSIONS: ReadonlyMap<string, Permission> = new Map<
  TenantSubjectType,
  Permission
>([
  ['role', PERMISSIONS.rolesManage],
  ['member', PERMISSIONS.membersManage],
  ['invitation', PERMISSIONS.membersManage],
])
