import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@monorepo/ui/components/empty';
import { LockIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  can,
  permissionLabel,
  usePermissions,
} from '@/features/access/permissions';
import type { Permission } from '@/features/access/permissions';
import { t } from '@/features/core/i18n';

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const permissions = usePermissions();

  if (can(permissions, permission)) return children;

  return (
    <div className="rounded-xl border border-dashed">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockIcon />
          </EmptyMedia>
          <EmptyTitle>
            <h1>{t('access.requirePermission.title')}</h1>
          </EmptyTitle>
          <EmptyDescription>
            {t('access.requirePermission.description', {
              label: permissionLabel(permission).label,
            })}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
