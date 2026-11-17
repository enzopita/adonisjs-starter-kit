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
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { CircleAlertIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { AdminMenuItem } from '@/features/admin/components/admin-menu-item'
import { ImpersonationBanner } from '@/features/admin/components/impersonation-banner'
import { adminMeQuery } from '@/features/admin/queries'
import { queries } from '@/features/core/api'
import { AppMark } from '@/features/core/components/app-mark'
import { errorMessage, isTuyauError } from '@/features/core/errors'
import { locale, resolveLocale, t } from '@/features/core/i18n'
import { LOCALES } from '@/features/core/locales'
import type { Locale } from '@/features/core/locales'
import { preferences } from '@/features/core/preferences'
import { session, useIsImpersonating } from '@/features/core/session'
import { WorkspaceSwitcher } from '@/features/tenancy/components/workspace-switcher'
import { tenantsQuery } from '@/features/tenancy/workspace'
import { UnverifiedEmailBanner } from '@/features/users/components/unverified-email-banner'
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

/**
 * Mirrors the profile's locale and time zone into the preferences store, so another device's
 * choice also applies here. An existing user with no stored locale or time zone yet gets the
 * active locale and the browser's own zone written up once. Runs once per page load: a second
 * effect pass (strict mode) or re-render must not repeat the write or the reload. Skipped while
 * impersonating: the browser and its preferences are the admin's, not the user's.
 */
function useSyncPreferences(
  user: { locale: Locale | null; timezone: string | null },
  impersonating: boolean,
) {
  const synced = useRef(false)
  const updateProfile = useMutation(queries.profile.profile.update.mutationOptions())

  useEffect(() => {
    if (synced.current || impersonating) return

    synced.current = true

    // Fresh browser detection, not the persisted `locale`: on a shared browser that value can be a
    // previous account's choice, and this account must never inherit it.
    const nextLocale = user.locale ?? resolveLocale(navigator.languages)
    const nextTimeZone = user.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone

    preferences.set({ locale: nextLocale, timeZone: nextTimeZone })

    // Only reload for a locale the next load can read back: one LOCALES lacks would reload
    // forever, and with blocked storage the reload would also drop the in-memory session.
    const reloadIfStale = () => {
      if (nextLocale !== locale && LOCALES.includes(nextLocale) && preferences.persists) {
        window.location.reload()
      }
    }

    if (user.locale === null || user.timezone === null) {
      // After the write settles, so the reload doesn't abort it.
      updateProfile.mutate(
        {
          body: {
            ...(user.locale === null && { locale: nextLocale }),
            ...(user.timezone === null && { timezone: nextTimeZone }),
          },
        },
        { onSettled: reloadIfStale },
      )
    } else {
      reloadIfStale()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per page load, guarded above.
  }, [])
}

function AppLayout() {
  const { data: user } = useSuspenseQuery(profileQuery())
  const { data: admin } = useSuspenseQuery(adminMeQuery())
  const impersonating = useIsImpersonating()

  useSyncPreferences(
    {
      // SAFETY: the backend only ever stores a locale from localeRule()'s supportedLocales.
      locale: user.data.locale as Locale | null,
      timezone: user.data.timezone,
    },
    impersonating,
  )

  return (
    <div className="flex min-h-svh flex-col">
      {impersonating && <ImpersonationBanner user={user.data} />}
      {!user.data.emailVerifiedAt && <UnverifiedEmailBanner email={user.data.email} />}
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
          {isTuyauError(error) ? errorMessage(error) : t('routes.app.pageFailed')}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => router.invalidate()}>{t('routes.app.tryAgain')}</Button>
      </EmptyContent>
    </Empty>
  )
}
