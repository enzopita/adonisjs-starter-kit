import { Badge } from '@monorepo/ui/components/badge'
import { Button } from '@monorepo/ui/components/button'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { queries } from '@/features/core/api'
import { ConfirmDialog } from '@/features/core/components/confirm-dialog'
import { PendingButton } from '@/features/core/components/pending-button'
import { errorMessage } from '@/features/core/errors'
import { t } from '@/features/core/i18n'
import { session } from '@/features/core/session'
import { profileQuery } from '@/features/users/profile'

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

type Confirming = 'disable' | 'grant' | 'revoke' | null

/** A platform admin can only lose the role, and never from themself: the API refuses the rest. */
export function UserActions({ row }: { row: AdminUserRow }) {
  const name = displayName(row)
  const navigate = useNavigate()
  const { data: me } = useSuspenseQuery(profileQuery())
  const [confirming, setConfirming] = useState<Confirming>(null)

  const closeDialog = (open: boolean) => {
    if (!open) setConfirming(null)
  }

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
        setConfirming(null)
        toast.success(t('admin.userActions.disabledToast', { name }))
      },
      onError: error => toast.error(errorMessage(error)),
    }),
  )

  const grant = useMutation(
    queries.admin.platformAdmins.store.mutationOptions({
      onSuccess: () => {
        setConfirming(null)
        toast.success(t('admin.userActions.madeAdmin', { name }))
      },
      onError: error => toast.error(errorMessage(error)),
    }),
  )

  const revoke = useMutation(
    queries.admin.platformAdmins.destroy.mutationOptions({
      onSuccess: () => {
        setConfirming(null)
        toast.success(t('admin.userActions.removedAdmin', { name }))
      },
      onError: error => toast.error(errorMessage(error)),
    }),
  )

  const params = { params: { id: row.user.id } }

  if (row.platformAdmin) {
    if (row.user.id === me.data.id) return null

    return (
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('admin.userActions.removeAdminFor', { name })}
          onClick={() => setConfirming('revoke')}
        >
          {t('admin.userActions.removeAdmin')}
        </Button>
        <ConfirmDialog
          open={confirming === 'revoke'}
          onOpenChange={closeDialog}
          title={t('admin.userActions.removeAdminTitle', { name })}
          description={t('admin.userActions.removeAdminDescription')}
          confirmLabel={t('admin.userActions.removeAdmin')}
          pending={revoke.isPending}
          onConfirm={() => revoke.mutate(params)}
        />
      </div>
    )
  }

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
            aria-label={t('admin.userActions.makeAdminFor', { name })}
            onClick={() => setConfirming('grant')}
          >
            {t('admin.userActions.makeAdmin')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('admin.userActions.disableFor', { name })}
            onClick={() => setConfirming('disable')}
          >
            {t('admin.userActions.disable')}
          </Button>
        </>
      )}

      <ConfirmDialog
        open={confirming === 'grant'}
        onOpenChange={closeDialog}
        title={t('admin.userActions.makeAdminTitle', { name })}
        description={t('admin.userActions.makeAdminDescription')}
        confirmLabel={t('admin.userActions.makeAdmin')}
        pending={grant.isPending}
        onConfirm={() => grant.mutate(params)}
      />
      <ConfirmDialog
        open={confirming === 'disable'}
        onOpenChange={closeDialog}
        title={t('admin.userActions.disableTitle', { name })}
        description={t('admin.userActions.disableDescription')}
        confirmLabel={t('admin.userActions.disable')}
        pending={disable.isPending}
        onConfirm={() => disable.mutate(params)}
      />
    </div>
  )
}
