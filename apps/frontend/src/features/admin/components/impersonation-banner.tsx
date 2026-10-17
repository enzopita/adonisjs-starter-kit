import { Button } from '@monorepo/ui/components/button'
import { useNavigate } from '@tanstack/react-router'
import { VenetianMaskIcon } from 'lucide-react'
import { api } from '@/features/core/api'
import { t } from '@/features/core/i18n'
import { session } from '@/features/core/session'

export function ImpersonationBanner({
  user,
}: {
  user: { email: string; fullName: string | null }
}) {
  const navigate = useNavigate()

  const stop = async () => {
    // Ends the impersonation token server-side; the admin's own session comes back either way.
    await api.profile.accessTokens.destroy({}).safe()
    session.stopImpersonating()
    await navigate({ to: '/admin/users' })
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-primary px-3 py-1.5 text-xs text-primary-foreground"
    >
      <VenetianMaskIcon className="size-4" aria-hidden />
      <span>
        {t('admin.impersonationBanner.signedInAs', {
          name: user.fullName ?? user.email,
          email: user.email,
        })}
      </span>
      <Button variant="secondary" size="sm" onClick={stop}>
        {t('admin.impersonationBanner.stop')}
      </Button>
    </div>
  )
}
