import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AdminAccessDenied } from '@/features/admin/components/admin-access-denied';
import { AdminTwoFactorRequired } from '@/features/admin/components/admin-two-factor-required';
import { ADMIN_NAV } from '@/features/admin/nav';
import { adminMeQuery } from '@/features/admin/queries';
import { SideNav } from '@/features/core/components/side-nav';
import { t } from '@/features/core/i18n';

/** The platform admin area. Its pages' loaders skip their requests for anyone else. */
export const Route = createFileRoute('/_app/admin')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const {
      data: { platformAdmin, twoFactorRequired },
    } = await queryClient.query(adminMeQuery());

    return { platformAdmin, canUseArea: platformAdmin && !twoFactorRequired };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { platformAdmin, canUseArea } = Route.useRouteContext();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:flex-row md:gap-8 md:p-6">
      {canUseArea && (
        <SideNav label={t('routes.admin.nav')} items={ADMIN_NAV} />
      )}
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        {canUseArea && <Outlet />}
        {!canUseArea && platformAdmin && <AdminTwoFactorRequired />}
        {!platformAdmin && <AdminAccessDenied />}
      </main>
    </div>
  );
}
