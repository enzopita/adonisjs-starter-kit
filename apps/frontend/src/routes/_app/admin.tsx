import { buttonVariants } from '@monorepo/ui/components/button'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { AdminAccessDenied } from '@/features/admin/components/admin-access-denied'
import { ADMIN_NAV } from '@/features/admin/nav'
import { adminMeQuery } from '@/features/admin/queries'
import { t } from '@/features/core/i18n'

/** The platform admin area. Its pages' loaders skip their requests for anyone else. */
export const Route = createFileRoute('/_app/admin')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const { platformAdmin } = (await queryClient.query(adminMeQuery())).data

    return { platformAdmin }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { platformAdmin } = Route.useRouteContext()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:flex-row md:gap-8 md:p-6">
      {platformAdmin && (
        <nav
          aria-label={t('routes.admin.nav')}
          className="-mx-1 flex shrink-0 gap-1 overflow-x-auto px-1 md:w-48 md:flex-col"
        >
          {ADMIN_NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true, includeSearch: false }}
              className={buttonVariants({ variant: 'ghost', className: 'justify-start' })}
              activeProps={{ className: 'bg-muted text-foreground' }}
            >
              <item.icon data-icon="inline-start" />
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        {platformAdmin ? <Outlet /> : <AdminAccessDenied />}
      </main>
    </div>
  )
}
