import { BuildingIcon, UsersIcon } from 'lucide-react';

import type { SideNavItem } from '@/features/core/components/side-nav';
import { t } from '@/features/core/i18n';

export const ADMIN_NAV: readonly SideNavItem[] = [
  { to: '/admin', label: t('admin.nav.workspaces'), icon: BuildingIcon },
  { to: '/admin/users', label: t('admin.nav.users'), icon: UsersIcon },
];
