import type { LucideIcon } from 'lucide-react'
import { HistoryIcon, LayoutDashboardIcon, MailIcon, ShieldIcon, UsersIcon } from 'lucide-react'
import { can } from '@/features/access/permissions'
import type { Permission } from '@/features/access/permissions'
import { t } from '@/features/core/i18n'

import type { FileRoutesByTo } from '@/routeTree.gen'

export type NavItem = {
  to: keyof FileRoutesByTo
  label: string
  description: string
  icon: LucideIcon
  requires: Permission | null
}

/** The workspace sections, in sidebar order. The sidebar and the overview cards both render from it. */
export const TENANT_NAV: readonly NavItem[] = [
  {
    to: '/',
    label: t('access.nav.overview'),
    description: t('access.nav.overviewDescription'),
    icon: LayoutDashboardIcon,
    requires: null,
  },
  {
    to: '/members',
    label: t('access.nav.members'),
    description: t('access.nav.membersDescription'),
    icon: UsersIcon,
    requires: 'members.manage',
  },
  {
    to: '/invitations',
    label: t('access.nav.invitations'),
    description: t('access.nav.invitationsDescription'),
    icon: MailIcon,
    requires: 'members.manage',
  },
  {
    to: '/roles',
    label: t('access.nav.roles'),
    description: t('access.nav.rolesDescription'),
    icon: ShieldIcon,
    requires: 'roles.manage',
  },
  {
    to: '/audit',
    label: t('access.nav.audit'),
    description: t('access.nav.auditDescription'),
    icon: HistoryIcon,
    requires: 'audit.view',
  },
]

export function reachableNav(permissions: readonly Permission[]) {
  return TENANT_NAV.filter(item => item.requires === null || can(permissions, item.requires))
}
