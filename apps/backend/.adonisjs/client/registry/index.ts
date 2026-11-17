/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.profile.update': {
    methods: ["PATCH"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['profile.profile.update']['types'],
  },
  'profile.avatar.update': {
    methods: ["PUT"],
    pattern: '/api/v1/account/avatar',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"avatar"]],
    types: placeholder as Registry['profile.avatar.update']['types'],
  },
  'attachments.attachments.store': {
    methods: ["POST"],
    pattern: '/api/v1/attachments',
    tokens: [[0,"api"],[0,"v1"],[0,"attachments"]],
    types: placeholder as Registry['attachments.attachments.store']['types'],
  },
  'tenants.tenants.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/tenants',
    tokens: [[0,"api"],[0,"v1"],[0,"tenants"]],
    types: placeholder as Registry['tenants.tenants.index']['types'],
  },
  'tenants.tenants.store': {
    methods: ["POST"],
    pattern: '/api/v1/tenants',
    tokens: [[0,"api"],[0,"v1"],[0,"tenants"]],
    types: placeholder as Registry['tenants.tenants.store']['types'],
  },
  'audit.audit_events.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/audit/events',
    tokens: [[0,"api"],[0,"v1"],[0,"audit"],[0,"events"]],
    types: placeholder as Registry['audit.audit_events.index']['types'],
  },
  'audit.account_activity.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/activity',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"activity"]],
    types: placeholder as Registry['audit.account_activity.index']['types'],
  },
  'admin.me.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/me',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"me"]],
    types: placeholder as Registry['admin.me.show']['types'],
  },
  'admin.tenants.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/tenants',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"tenants"]],
    types: placeholder as Registry['admin.tenants.index']['types'],
  },
  'admin.tenants.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/tenants/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"tenants"],[1,"id"]],
    types: placeholder as Registry['admin.tenants.show']['types'],
  },
  'admin.tenants.update': {
    methods: ["PUT"],
    pattern: '/api/v1/admin/tenants/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"tenants"],[1,"id"]],
    types: placeholder as Registry['admin.tenants.update']['types'],
  },
  'admin.tenant_suspensions.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/tenants/:id/suspension',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"tenants"],[1,"id"],[0,"suspension"]],
    types: placeholder as Registry['admin.tenant_suspensions.store']['types'],
  },
  'admin.tenant_suspensions.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/tenants/:id/suspension',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"tenants"],[1,"id"],[0,"suspension"]],
    types: placeholder as Registry['admin.tenant_suspensions.destroy']['types'],
  },
  'admin.users.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/users',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"users"]],
    types: placeholder as Registry['admin.users.index']['types'],
  },
  'admin.user_suspensions.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/users/:id/suspension',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"users"],[1,"id"],[0,"suspension"]],
    types: placeholder as Registry['admin.user_suspensions.store']['types'],
  },
  'admin.user_suspensions.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/users/:id/suspension',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"users"],[1,"id"],[0,"suspension"]],
    types: placeholder as Registry['admin.user_suspensions.destroy']['types'],
  },
  'admin.impersonations.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/users/:id/impersonation',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"users"],[1,"id"],[0,"impersonation"]],
    types: placeholder as Registry['admin.impersonations.store']['types'],
  },
  'admin.two_factor_resets.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/users/:id/two-factor',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"users"],[1,"id"],[0,"two-factor"]],
    types: placeholder as Registry['admin.two_factor_resets.destroy']['types'],
  },
  'admin.platform_admins.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/users/:id/platform-admin',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"users"],[1,"id"],[0,"platform-admin"]],
    types: placeholder as Registry['admin.platform_admins.store']['types'],
  },
  'admin.platform_admins.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/users/:id/platform-admin',
    tokens: [[0,"api"],[0,"v1"],[0,"admin"],[0,"users"],[1,"id"],[0,"platform-admin"]],
    types: placeholder as Registry['admin.platform_admins.destroy']['types'],
  },
  'health_checks.live': {
    methods: ["GET","HEAD"],
    pattern: '/health/live',
    tokens: [[0,"health"],[0,"live"]],
    types: placeholder as Registry['health_checks.live']['types'],
  },
  'health_checks.ready': {
    methods: ["GET","HEAD"],
    pattern: '/health/ready',
    tokens: [[0,"health"],[0,"ready"]],
    types: placeholder as Registry['health_checks.ready']['types'],
  },
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"signup"]],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'auth.two_factor_logins.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login/two-factor',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"],[0,"two-factor"]],
    types: placeholder as Registry['auth.two_factor_logins.store']['types'],
  },
  'auth.password_resets.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/password/forgot',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"password"],[0,"forgot"]],
    types: placeholder as Registry['auth.password_resets.store']['types'],
  },
  'auth.password_resets.update': {
    methods: ["POST"],
    pattern: '/api/v1/auth/password/reset',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"password"],[0,"reset"]],
    types: placeholder as Registry['auth.password_resets.update']['types'],
  },
  'auth.email_verifications.update': {
    methods: ["POST"],
    pattern: '/api/v1/auth/email/verify',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"email"],[0,"verify"]],
    types: placeholder as Registry['auth.email_verifications.update']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"logout"]],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'profile.sessions.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/sessions',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"sessions"]],
    types: placeholder as Registry['profile.sessions.index']['types'],
  },
  'profile.sessions.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/account/sessions/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"sessions"],[1,"id"]],
    types: placeholder as Registry['profile.sessions.destroy']['types'],
  },
  'profile.sessions.destroy_all': {
    methods: ["DELETE"],
    pattern: '/api/v1/account/sessions',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"sessions"]],
    types: placeholder as Registry['profile.sessions.destroy_all']['types'],
  },
  'profile.email_verifications.store': {
    methods: ["POST"],
    pattern: '/api/v1/account/email/verification',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"email"],[0,"verification"]],
    types: placeholder as Registry['profile.email_verifications.store']['types'],
  },
  'profile.two_factor.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/two-factor',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"two-factor"]],
    types: placeholder as Registry['profile.two_factor.show']['types'],
  },
  'profile.two_factor.store': {
    methods: ["POST"],
    pattern: '/api/v1/account/two-factor',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"two-factor"]],
    types: placeholder as Registry['profile.two_factor.store']['types'],
  },
  'profile.two_factor.confirm': {
    methods: ["POST"],
    pattern: '/api/v1/account/two-factor/confirmation',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"two-factor"],[0,"confirmation"]],
    types: placeholder as Registry['profile.two_factor.confirm']['types'],
  },
  'profile.two_factor.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/account/two-factor',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"two-factor"]],
    types: placeholder as Registry['profile.two_factor.destroy']['types'],
  },
  'profile.two_factor.regenerate_recovery_codes': {
    methods: ["POST"],
    pattern: '/api/v1/account/two-factor/recovery-codes',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"two-factor"],[0,"recovery-codes"]],
    types: placeholder as Registry['profile.two_factor.regenerate_recovery_codes']['types'],
  },
  'access.my_permissions.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/access/me',
    tokens: [[0,"api"],[0,"v1"],[0,"access"],[0,"me"]],
    types: placeholder as Registry['access.my_permissions.show']['types'],
  },
  'access.permission_catalog.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/access/permissions',
    tokens: [[0,"api"],[0,"v1"],[0,"access"],[0,"permissions"]],
    types: placeholder as Registry['access.permission_catalog.show']['types'],
  },
  'access.roles.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/roles',
    tokens: [[0,"api"],[0,"v1"],[0,"roles"]],
    types: placeholder as Registry['access.roles.index']['types'],
  },
  'access.roles.store': {
    methods: ["POST"],
    pattern: '/api/v1/roles',
    tokens: [[0,"api"],[0,"v1"],[0,"roles"]],
    types: placeholder as Registry['access.roles.store']['types'],
  },
  'access.roles.update': {
    methods: ["PUT"],
    pattern: '/api/v1/roles/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"roles"],[1,"id"]],
    types: placeholder as Registry['access.roles.update']['types'],
  },
  'access.roles.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/roles/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"roles"],[1,"id"]],
    types: placeholder as Registry['access.roles.destroy']['types'],
  },
  'access.members.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/members',
    tokens: [[0,"api"],[0,"v1"],[0,"members"]],
    types: placeholder as Registry['access.members.index']['types'],
  },
  'access.member_roles.update': {
    methods: ["PUT"],
    pattern: '/api/v1/members/:userId/role',
    tokens: [[0,"api"],[0,"v1"],[0,"members"],[1,"userId"],[0,"role"]],
    types: placeholder as Registry['access.member_roles.update']['types'],
  },
  'access.member_permissions.update': {
    methods: ["PUT"],
    pattern: '/api/v1/members/:userId/permissions',
    tokens: [[0,"api"],[0,"v1"],[0,"members"],[1,"userId"],[0,"permissions"]],
    types: placeholder as Registry['access.member_permissions.update']['types'],
  },
  'access.invitations.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/invitations',
    tokens: [[0,"api"],[0,"v1"],[0,"invitations"]],
    types: placeholder as Registry['access.invitations.index']['types'],
  },
  'access.invitations.store': {
    methods: ["POST"],
    pattern: '/api/v1/invitations',
    tokens: [[0,"api"],[0,"v1"],[0,"invitations"]],
    types: placeholder as Registry['access.invitations.store']['types'],
  },
  'access.invitations.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/invitations/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"invitations"],[1,"id"]],
    types: placeholder as Registry['access.invitations.destroy']['types'],
  },
  'invitation_accept.store': {
    methods: ["POST"],
    pattern: '/api/v1/invitations/accept',
    tokens: [[0,"api"],[0,"v1"],[0,"invitations"],[0,"accept"]],
    types: placeholder as Registry['invitation_accept.store']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
