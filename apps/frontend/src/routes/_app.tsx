import { Button } from '@monorepo/ui/components/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@monorepo/ui/components/empty'
import { Separator } from '@monorepo/ui/components/separator'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { TuyauError } from '@tuyau/core/client'
import { CircleAlertIcon } from 'lucide-react'
import { AdminMenuItem } from '@/features/admin/components/admin-menu-item'
import { ImpersonationBanner } from '@/features/admin/components/impersonation-banner'
import { adminMeQuery } from '@/features/admin/queries'
import { AppMark } from '@/features/core/components/app-mark'
import { errorMessage } from '@/features/core/errors'
import { t } from '@/features/core/i18n'
import { session, useIsImpersonating } from '@/features/core/session'
import { WorkspaceSwitcher } from '@/features/tenancy/components/workspace-switcher'
import { tenantsQuery } from '@/features/tenancy/workspace'
import { UserMenu } from '@/features/users/components/user-menu'
import { profileQuery } from '@/features/users/profile'

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ location }) => {
    if (!session.isAuthenticated()) {
      throw redirect({ to: '/login', search: returnTo(location.href) })
    }
  },
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.query(profileQuery()),
      queryClient.query(tenantsQuery()),
      queryClient.query(adminMeQuery()),
    ]),
  component: AppLayout,
  errorComponent: AppError,
})

/** Sends the user back where they were after signing in; the home page is where sign-in lands anyway. */
function returnTo(href: string) {
  return href === '/' ? {} : { redirect: href }
}

function AppLayout() {
  const { data: user } = useSuspenseQuery(profileQuery())
  const { data: admin } = useSuspenseQuery(adminMeQuery())
  const impersonating = useIsImpersonating()

  return (
    <div className="flex min-h-svh flex-col">
      {impersonating && <ImpersonationBanner user={user.data} />}
      <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b bg-background px-3 md:px-4">
        <AppMark />
        <Separator orientation="vertical" className="mx-1 my-3" />
        <WorkspaceSwitcher />
        <div className="ml-auto">
          <UserMenu user={user.data}>{admin.data.platformAdmin && <AdminMenuItem />}</UserMenu>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

function AppError({ error }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <Empty className="min-h-svh">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>
          <h1>{t('routes.app.wentWrong')}</h1>
        </EmptyTitle>
        <EmptyDescription>
          {error instanceof TuyauError ? errorMessage(error) : t('routes.app.pageFailed')}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => router.invalidate()}>{t('routes.app.tryAgain')}</Button>
      </EmptyContent>
    </Empty>
  )
}
