/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    avatar: {
      update: typeof routes['profile.avatar.update']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
  }
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
  }
  attachments: {
    attachments: {
      store: typeof routes['attachments.attachments.store']
    }
  }
  tenants: {
    tenants: {
      index: typeof routes['tenants.tenants.index']
      store: typeof routes['tenants.tenants.store']
    }
  }
  access: {
    myPermissions: {
      show: typeof routes['access.my_permissions.show']
    }
    permissionCatalog: {
      show: typeof routes['access.permission_catalog.show']
    }
    roles: {
      index: typeof routes['access.roles.index']
      store: typeof routes['access.roles.store']
      update: typeof routes['access.roles.update']
      destroy: typeof routes['access.roles.destroy']
    }
    members: {
      index: typeof routes['access.members.index']
    }
    memberRoles: {
      update: typeof routes['access.member_roles.update']
    }
    memberPermissions: {
      update: typeof routes['access.member_permissions.update']
    }
    invitations: {
      index: typeof routes['access.invitations.index']
      store: typeof routes['access.invitations.store']
      destroy: typeof routes['access.invitations.destroy']
    }
  }
  invitationAccept: {
    store: typeof routes['invitation_accept.store']
  }
  audit: {
    auditEvents: {
      index: typeof routes['audit.audit_events.index']
    }
    accountActivity: {
      index: typeof routes['audit.account_activity.index']
    }
  }
  admin: {
    me: {
      show: typeof routes['admin.me.show']
    }
    tenants: {
      index: typeof routes['admin.tenants.index']
      show: typeof routes['admin.tenants.show']
      update: typeof routes['admin.tenants.update']
    }
    tenantSuspensions: {
      store: typeof routes['admin.tenant_suspensions.store']
      destroy: typeof routes['admin.tenant_suspensions.destroy']
    }
    users: {
      index: typeof routes['admin.users.index']
    }
    userSuspensions: {
      store: typeof routes['admin.user_suspensions.store']
      destroy: typeof routes['admin.user_suspensions.destroy']
    }
  }
  healthChecks: {
    live: typeof routes['health_checks.live']
    ready: typeof routes['health_checks.ready']
  }
}
