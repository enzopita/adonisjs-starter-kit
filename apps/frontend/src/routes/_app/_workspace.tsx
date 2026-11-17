import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { reachableNav } from '@/features/access/nav';
import { usePermissions } from '@/features/access/permissions';
import { myPermissionsQuery } from '@/features/access/queries';
import { SideNav } from '@/features/core/components/side-nav';
import { t } from '@/features/core/i18n';
import {
  resolveTabWorkspace,
  tenantsQuery,
} from '@/features/tenancy/workspace';

/** Pages about one workspace, the one chosen in the switcher; the URL never names it. */
export const Route = createFileRoute('/_app/_workspace')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const tenants = await queryClient.query(tenantsQuery());
    const tenant = resolveTabWorkspace(tenants.data);

    if (!tenant) {
      throw redirect({ to: '/onboarding' });
    }

    if (tenant.suspendedAt) {
      throw redirect({ to: '/workspace-suspended' });
    }

    await queryClient.query(myPermissionsQuery(tenant.id));

    return { tenant };
  },
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const permissions = usePermissions();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:flex-row md:gap-8 md:p-6">
      <SideNav
        label={t('routes.workspace.nav')}
        items={reachableNav(permissions)}
      />
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <Outlet />
      </main>
    </div>
  );
}
