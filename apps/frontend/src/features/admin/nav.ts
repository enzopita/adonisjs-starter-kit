import type { LucideIcon } from 'lucide-react'
import { BuildingIcon, UsersIcon } from 'lucide-react'
import { t } from '@/features/core/i18n'
import type { FileRoutesByTo } from '@/routeTree.gen'

export const ADMIN_NAV: readonly { to: keyof FileRoutesByTo; label: string; icon: LucideIcon }[] = [
  { to: '/admin', label: t('admin.nav.workspaces'), icon: BuildingIcon },
  { to: '/admin/users', label: t('admin.nav.users'), icon: UsersIcon },
]
