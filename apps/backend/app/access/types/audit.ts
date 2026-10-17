import type Role from '#access/models/role'
import type { Changes, TenantEvent } from '#core/audit/types'

export type MemberSnapshot = { email: string; fullName: string | null }

export type RoleSnapshot = { id: string; name: string }

type InvitationData = { email: string; role: RoleSnapshot | null }

declare module '#core/audit/types' {
  interface AuditEvents {
    'role.created': TenantEvent<'role', { name: string; permissions: string[] }>
    'role.updated': TenantEvent<
      'role',
      { name: string; changes: Changes<Role, 'name' | 'permissions'> }
    >
    'role.deleted': TenantEvent<'role', { name: string; permissions: string[] }>
    'member.joined': TenantEvent<'member', { member: MemberSnapshot; role: RoleSnapshot | null }>
    'member.role_changed': TenantEvent<
      'member',
      { member: MemberSnapshot; from: RoleSnapshot | null; to: RoleSnapshot | null }
    >
    'member.permissions_changed': TenantEvent<
      'member',
      { member: MemberSnapshot; from: string[]; to: string[] }
    >
    'invitation.sent': TenantEvent<'invitation', InvitationData>
    'invitation.revoked': TenantEvent<'invitation', InvitationData>
    'invitation.accepted': TenantEvent<'invitation', InvitationData>
  }
}
