/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [{"old":"/api/v1/account/profile","type":0,"val":"api","end":""},{"old":"/api/v1/account/profile","type":0,"val":"v1","end":""},{"old":"/api/v1/account/profile","type":0,"val":"account","end":""},{"old":"/api/v1/account/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.avatar.update': {
    methods: ["PUT"],
    pattern: '/api/v1/account/avatar',
    tokens: [{"old":"/api/v1/account/avatar","type":0,"val":"api","end":""},{"old":"/api/v1/account/avatar","type":0,"val":"v1","end":""},{"old":"/api/v1/account/avatar","type":0,"val":"account","end":""},{"old":"/api/v1/account/avatar","type":0,"val":"avatar","end":""}],
    types: placeholder as Registry['profile.avatar.update']['types'],
  },
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [{"old":"/api/v1/auth/signup","type":0,"val":"api","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [{"old":"/api/v1/auth/login","type":0,"val":"api","end":""},{"old":"/api/v1/auth/login","type":0,"val":"v1","end":""},{"old":"/api/v1/auth/login","type":0,"val":"auth","end":""},{"old":"/api/v1/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [{"old":"/api/v1/account/logout","type":0,"val":"api","end":""},{"old":"/api/v1/account/logout","type":0,"val":"v1","end":""},{"old":"/api/v1/account/logout","type":0,"val":"account","end":""},{"old":"/api/v1/account/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'attachments.attachments.store': {
    methods: ["POST"],
    pattern: '/api/v1/attachments',
    tokens: [{"old":"/api/v1/attachments","type":0,"val":"api","end":""},{"old":"/api/v1/attachments","type":0,"val":"v1","end":""},{"old":"/api/v1/attachments","type":0,"val":"attachments","end":""}],
    types: placeholder as Registry['attachments.attachments.store']['types'],
  },
  'tenants.tenants.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/tenants',
    tokens: [{"old":"/api/v1/tenants","type":0,"val":"api","end":""},{"old":"/api/v1/tenants","type":0,"val":"v1","end":""},{"old":"/api/v1/tenants","type":0,"val":"tenants","end":""}],
    types: placeholder as Registry['tenants.tenants.index']['types'],
  },
  'tenants.tenants.store': {
    methods: ["POST"],
    pattern: '/api/v1/tenants',
    tokens: [{"old":"/api/v1/tenants","type":0,"val":"api","end":""},{"old":"/api/v1/tenants","type":0,"val":"v1","end":""},{"old":"/api/v1/tenants","type":0,"val":"tenants","end":""}],
    types: placeholder as Registry['tenants.tenants.store']['types'],
  },
  'access.my_permissions.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/access/me',
    tokens: [{"old":"/api/v1/access/me","type":0,"val":"api","end":""},{"old":"/api/v1/access/me","type":0,"val":"v1","end":""},{"old":"/api/v1/access/me","type":0,"val":"access","end":""},{"old":"/api/v1/access/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['access.my_permissions.show']['types'],
  },
  'access.permission_catalog.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/access/permissions',
    tokens: [{"old":"/api/v1/access/permissions","type":0,"val":"api","end":""},{"old":"/api/v1/access/permissions","type":0,"val":"v1","end":""},{"old":"/api/v1/access/permissions","type":0,"val":"access","end":""},{"old":"/api/v1/access/permissions","type":0,"val":"permissions","end":""}],
    types: placeholder as Registry['access.permission_catalog.show']['types'],
  },
  'access.roles.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/roles',
    tokens: [{"old":"/api/v1/roles","type":0,"val":"api","end":""},{"old":"/api/v1/roles","type":0,"val":"v1","end":""},{"old":"/api/v1/roles","type":0,"val":"roles","end":""}],
    types: placeholder as Registry['access.roles.index']['types'],
  },
  'access.roles.store': {
    methods: ["POST"],
    pattern: '/api/v1/roles',
    tokens: [{"old":"/api/v1/roles","type":0,"val":"api","end":""},{"old":"/api/v1/roles","type":0,"val":"v1","end":""},{"old":"/api/v1/roles","type":0,"val":"roles","end":""}],
    types: placeholder as Registry['access.roles.store']['types'],
  },
  'access.roles.update': {
    methods: ["PUT"],
    pattern: '/api/v1/roles/:id',
    tokens: [{"old":"/api/v1/roles/:id","type":0,"val":"api","end":""},{"old":"/api/v1/roles/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/roles/:id","type":0,"val":"roles","end":""},{"old":"/api/v1/roles/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['access.roles.update']['types'],
  },
  'access.roles.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/roles/:id',
    tokens: [{"old":"/api/v1/roles/:id","type":0,"val":"api","end":""},{"old":"/api/v1/roles/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/roles/:id","type":0,"val":"roles","end":""},{"old":"/api/v1/roles/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['access.roles.destroy']['types'],
  },
  'access.members.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/members',
    tokens: [{"old":"/api/v1/members","type":0,"val":"api","end":""},{"old":"/api/v1/members","type":0,"val":"v1","end":""},{"old":"/api/v1/members","type":0,"val":"members","end":""}],
    types: placeholder as Registry['access.members.index']['types'],
  },
  'access.member_roles.update': {
    methods: ["PUT"],
    pattern: '/api/v1/members/:userId/role',
    tokens: [{"old":"/api/v1/members/:userId/role","type":0,"val":"api","end":""},{"old":"/api/v1/members/:userId/role","type":0,"val":"v1","end":""},{"old":"/api/v1/members/:userId/role","type":0,"val":"members","end":""},{"old":"/api/v1/members/:userId/role","type":1,"val":"userId","end":""},{"old":"/api/v1/members/:userId/role","type":0,"val":"role","end":""}],
    types: placeholder as Registry['access.member_roles.update']['types'],
  },
  'access.member_permissions.update': {
    methods: ["PUT"],
    pattern: '/api/v1/members/:userId/permissions',
    tokens: [{"old":"/api/v1/members/:userId/permissions","type":0,"val":"api","end":""},{"old":"/api/v1/members/:userId/permissions","type":0,"val":"v1","end":""},{"old":"/api/v1/members/:userId/permissions","type":0,"val":"members","end":""},{"old":"/api/v1/members/:userId/permissions","type":1,"val":"userId","end":""},{"old":"/api/v1/members/:userId/permissions","type":0,"val":"permissions","end":""}],
    types: placeholder as Registry['access.member_permissions.update']['types'],
  },
  'access.invitations.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/invitations',
    tokens: [{"old":"/api/v1/invitations","type":0,"val":"api","end":""},{"old":"/api/v1/invitations","type":0,"val":"v1","end":""},{"old":"/api/v1/invitations","type":0,"val":"invitations","end":""}],
    types: placeholder as Registry['access.invitations.index']['types'],
  },
  'access.invitations.store': {
    methods: ["POST"],
    pattern: '/api/v1/invitations',
    tokens: [{"old":"/api/v1/invitations","type":0,"val":"api","end":""},{"old":"/api/v1/invitations","type":0,"val":"v1","end":""},{"old":"/api/v1/invitations","type":0,"val":"invitations","end":""}],
    types: placeholder as Registry['access.invitations.store']['types'],
  },
  'access.invitations.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/invitations/:id',
    tokens: [{"old":"/api/v1/invitations/:id","type":0,"val":"api","end":""},{"old":"/api/v1/invitations/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/invitations/:id","type":0,"val":"invitations","end":""},{"old":"/api/v1/invitations/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['access.invitations.destroy']['types'],
  },
  'invitation_accept.store': {
    methods: ["POST"],
    pattern: '/api/v1/invitations/accept',
    tokens: [{"old":"/api/v1/invitations/accept","type":0,"val":"api","end":""},{"old":"/api/v1/invitations/accept","type":0,"val":"v1","end":""},{"old":"/api/v1/invitations/accept","type":0,"val":"invitations","end":""},{"old":"/api/v1/invitations/accept","type":0,"val":"accept","end":""}],
    types: placeholder as Registry['invitation_accept.store']['types'],
  },
  'audit.audit_events.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/audit/events',
    tokens: [{"old":"/api/v1/audit/events","type":0,"val":"api","end":""},{"old":"/api/v1/audit/events","type":0,"val":"v1","end":""},{"old":"/api/v1/audit/events","type":0,"val":"audit","end":""},{"old":"/api/v1/audit/events","type":0,"val":"events","end":""}],
    types: placeholder as Registry['audit.audit_events.index']['types'],
  },
  'audit.account_activity.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/activity',
    tokens: [{"old":"/api/v1/account/activity","type":0,"val":"api","end":""},{"old":"/api/v1/account/activity","type":0,"val":"v1","end":""},{"old":"/api/v1/account/activity","type":0,"val":"account","end":""},{"old":"/api/v1/account/activity","type":0,"val":"activity","end":""}],
    types: placeholder as Registry['audit.account_activity.index']['types'],
  },
  'admin.me.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/me',
    tokens: [{"old":"/api/v1/admin/me","type":0,"val":"api","end":""},{"old":"/api/v1/admin/me","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/me","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['admin.me.show']['types'],
  },
  'admin.tenants.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/tenants',
    tokens: [{"old":"/api/v1/admin/tenants","type":0,"val":"api","end":""},{"old":"/api/v1/admin/tenants","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/tenants","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/tenants","type":0,"val":"tenants","end":""}],
    types: placeholder as Registry['admin.tenants.index']['types'],
  },
  'admin.tenants.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/tenants/:id',
    tokens: [{"old":"/api/v1/admin/tenants/:id","type":0,"val":"api","end":""},{"old":"/api/v1/admin/tenants/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/tenants/:id","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/tenants/:id","type":0,"val":"tenants","end":""},{"old":"/api/v1/admin/tenants/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.tenants.show']['types'],
  },
  'admin.tenants.update': {
    methods: ["PUT"],
    pattern: '/api/v1/admin/tenants/:id',
    tokens: [{"old":"/api/v1/admin/tenants/:id","type":0,"val":"api","end":""},{"old":"/api/v1/admin/tenants/:id","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/tenants/:id","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/tenants/:id","type":0,"val":"tenants","end":""},{"old":"/api/v1/admin/tenants/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.tenants.update']['types'],
  },
  'admin.tenant_suspensions.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/tenants/:id/suspension',
    tokens: [{"old":"/api/v1/admin/tenants/:id/suspension","type":0,"val":"api","end":""},{"old":"/api/v1/admin/tenants/:id/suspension","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/tenants/:id/suspension","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/tenants/:id/suspension","type":0,"val":"tenants","end":""},{"old":"/api/v1/admin/tenants/:id/suspension","type":1,"val":"id","end":""},{"old":"/api/v1/admin/tenants/:id/suspension","type":0,"val":"suspension","end":""}],
    types: placeholder as Registry['admin.tenant_suspensions.store']['types'],
  },
  'admin.tenant_suspensions.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/tenants/:id/suspension',
    tokens: [{"old":"/api/v1/admin/tenants/:id/suspension","type":0,"val":"api","end":""},{"old":"/api/v1/admin/tenants/:id/suspension","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/tenants/:id/suspension","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/tenants/:id/suspension","type":0,"val":"tenants","end":""},{"old":"/api/v1/admin/tenants/:id/suspension","type":1,"val":"id","end":""},{"old":"/api/v1/admin/tenants/:id/suspension","type":0,"val":"suspension","end":""}],
    types: placeholder as Registry['admin.tenant_suspensions.destroy']['types'],
  },
  'admin.users.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/admin/users',
    tokens: [{"old":"/api/v1/admin/users","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['admin.users.index']['types'],
  },
  'admin.user_suspensions.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/users/:id/suspension',
    tokens: [{"old":"/api/v1/admin/users/:id/suspension","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users/:id/suspension","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users/:id/suspension","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users/:id/suspension","type":0,"val":"users","end":""},{"old":"/api/v1/admin/users/:id/suspension","type":1,"val":"id","end":""},{"old":"/api/v1/admin/users/:id/suspension","type":0,"val":"suspension","end":""}],
    types: placeholder as Registry['admin.user_suspensions.store']['types'],
  },
  'admin.user_suspensions.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/users/:id/suspension',
    tokens: [{"old":"/api/v1/admin/users/:id/suspension","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users/:id/suspension","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users/:id/suspension","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users/:id/suspension","type":0,"val":"users","end":""},{"old":"/api/v1/admin/users/:id/suspension","type":1,"val":"id","end":""},{"old":"/api/v1/admin/users/:id/suspension","type":0,"val":"suspension","end":""}],
    types: placeholder as Registry['admin.user_suspensions.destroy']['types'],
  },
  'admin.impersonations.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/users/:id/impersonation',
    tokens: [{"old":"/api/v1/admin/users/:id/impersonation","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users/:id/impersonation","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users/:id/impersonation","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users/:id/impersonation","type":0,"val":"users","end":""},{"old":"/api/v1/admin/users/:id/impersonation","type":1,"val":"id","end":""},{"old":"/api/v1/admin/users/:id/impersonation","type":0,"val":"impersonation","end":""}],
    types: placeholder as Registry['admin.impersonations.store']['types'],
  },
  'admin.platform_admins.store': {
    methods: ["POST"],
    pattern: '/api/v1/admin/users/:id/platform-admin',
    tokens: [{"old":"/api/v1/admin/users/:id/platform-admin","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users/:id/platform-admin","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users/:id/platform-admin","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users/:id/platform-admin","type":0,"val":"users","end":""},{"old":"/api/v1/admin/users/:id/platform-admin","type":1,"val":"id","end":""},{"old":"/api/v1/admin/users/:id/platform-admin","type":0,"val":"platform-admin","end":""}],
    types: placeholder as Registry['admin.platform_admins.store']['types'],
  },
  'admin.platform_admins.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/admin/users/:id/platform-admin',
    tokens: [{"old":"/api/v1/admin/users/:id/platform-admin","type":0,"val":"api","end":""},{"old":"/api/v1/admin/users/:id/platform-admin","type":0,"val":"v1","end":""},{"old":"/api/v1/admin/users/:id/platform-admin","type":0,"val":"admin","end":""},{"old":"/api/v1/admin/users/:id/platform-admin","type":0,"val":"users","end":""},{"old":"/api/v1/admin/users/:id/platform-admin","type":1,"val":"id","end":""},{"old":"/api/v1/admin/users/:id/platform-admin","type":0,"val":"platform-admin","end":""}],
    types: placeholder as Registry['admin.platform_admins.destroy']['types'],
  },
  'health_checks.live': {
    methods: ["GET","HEAD"],
    pattern: '/health/live',
    tokens: [{"old":"/health/live","type":0,"val":"health","end":""},{"old":"/health/live","type":0,"val":"live","end":""}],
    types: placeholder as Registry['health_checks.live']['types'],
  },
  'health_checks.ready': {
    methods: ["GET","HEAD"],
    pattern: '/health/ready',
    tokens: [{"old":"/health/ready","type":0,"val":"health","end":""},{"old":"/health/ready","type":0,"val":"ready","end":""}],
    types: placeholder as Registry['health_checks.ready']['types'],
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
