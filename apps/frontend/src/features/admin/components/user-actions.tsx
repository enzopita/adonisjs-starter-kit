import { Badge } from '@monorepo/ui/components/badge'
import { Button } from '@monorepo/ui/components/button'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { queries } from '@/features/core/api'
import { ConfirmDialog } from '@/features/core/components/confirm-dialog'
import { PendingButton } from '@/features/core/components/pending-button'
import { errorMessage } from '@/features/core/errors'
import { t } from '@/features/core/i18n'
import { session } from '@/features/core/session'

export type AdminUserRow = {
  user: { id: string; email: string; fullName: string | null }
  disabledAt: string | null
  platformAdmin: boolean
}

export const displayName = ({ user }: AdminUserRow) => user.fullName ?? user.email

export function UserStatus({ row }: { row: AdminUserRow }) {
  if (row.platformAdmin) return <Badge variant="secondary">{t('admin.userActions.admin')}</Badge>

  if (row.disabledAt) return <Badge variant="destructive">{t('admin.userActions.disabled')}</Badge>

  return <Badge variant="outline">{t('admin.userActions.active')}</Badge>
}

/** Platform admins are managed from the command line: the API refuses these actions on them. */
export function UserActions({ row }: { row: AdminUserRow }) {
  const name = displayName(row)
  const navigate = useNavigate()
  const [disabling, setDisabling] = useState(false)

  const impersonate = useMutation(
    queries.admin.impersonations.store.mutationOptions({
      onSuccess: async ({ data }) => {
        session.impersonate(data.token)
        await navigate({ to: '/' })
      },
      onError: error => toast.error(errorMessage(error)),
    }),
  )

  const enable = useMutation(
    queries.admin.userSuspensions.destroy.mutationOptions({
      onSuccess: () => toast.success(t('admin.userActions.enabled', { name })),
      onError: error => toast.error(errorMessage(error)),
    }),
  )

  const disable = useMutation(
    queries.admin.userSuspensions.store.mutationOptions({
      onSuccess: () => {
        setDisabling(false)
        toast.success(t('admin.userActions.disabledToast', { name }))
      },
      onError: error => toast.error(errorMessage(error)),
    }),
  )

  if (row.platformAdmin) return null

  const params = { params: { id: row.user.id } }

  return (
    <div className="flex justify-end gap-1">
      {row.disabledAt ? (
        <PendingButton
          variant="outline"
          size="sm"
          pending={enable.isPending}
          aria-label={t('admin.userActions.enableFor', { name })}
          onClick={() => enable.mutate(params)}
        >
          {t('admin.userActions.enable')}
        </PendingButton>
      ) : (
        <>
          <PendingButton
            variant="outline"
            size="sm"
            pending={impersonate.isPending}
            aria-label={t('admin.userActions.impersonateFor', { name })}
            onClick={() => impersonate.mutate(params)}
          >
            {t('admin.userActions.impersonate')}
          </PendingButton>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('admin.userActions.disableFor', { name })}
            onClick={() => setDisabling(true)}
          >
            {t('admin.userActions.disable')}
          </Button>
        </>
      )}

      <ConfirmDialog
        open={disabling}
        onOpenChange={setDisabling}
        title={t('admin.userActions.disableTitle', { name })}
        description={t('admin.userActions.disableDescription')}
        confirmLabel={t('admin.userActions.disable')}
        pending={disable.isPending}
        onConfirm={() => disable.mutate(params)}
      />
    </div>
  )
}
