import { Badge } from '@monorepo/ui/components/badge'
import { Button } from '@monorepo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@monorepo/ui/components/dropdown-menu'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  BanIcon,
  CircleCheckIcon,
  MoreHorizontalIcon,
  ShieldMinusIcon,
  ShieldPlusIcon,
  VenetianMaskIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { queries } from '@/features/core/api'
import { ConfirmDialog } from '@/features/core/components/confirm-dialog'
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

type RowAction = {
  key: 'impersonate' | 'makeAdmin' | 'disable' | 'enable' | 'removeAdmin'
  label: string
  icon: LucideIcon
  destructive?: boolean
  disabled?: boolean
  onSelect: () => void
}

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
  const isSelf = row.user.id === me.data.id

  if (row.platformAdmin && isSelf) return null

  const actions: RowAction[] = row.platformAdmin
    ? [
        {
          key: 'removeAdmin',
          label: t('admin.userActions.removeAdmin'),
          icon: ShieldMinusIcon,
          destructive: true,
          onSelect: () => setConfirming('revoke'),
        },
      ]
    : row.disabledAt
      ? [
          {
            key: 'enable',
            label: t('admin.userActions.enable'),
            icon: CircleCheckIcon,
            disabled: enable.isPending,
            onSelect: () => enable.mutate(params),
          },
        ]
      : [
          {
            key: 'impersonate',
            label: t('admin.userActions.impersonate'),
            icon: VenetianMaskIcon,
            disabled: impersonate.isPending,
            onSelect: () => impersonate.mutate(params),
          },
          {
            key: 'makeAdmin',
            label: t('admin.userActions.makeAdmin'),
            icon: ShieldPlusIcon,
            onSelect: () => setConfirming('grant'),
          },
          {
            key: 'disable',
            label: t('admin.userActions.disable'),
            icon: BanIcon,
            destructive: true,
            onSelect: () => setConfirming('disable'),
          },
        ]

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('admin.userActions.actionsFor', { name })}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto max-w-xs">
          {actions.map(action => (
            <DropdownMenuItem
              key={action.key}
              variant={action.destructive ? 'destructive' : 'default'}
              disabled={action.disabled}
              onClick={action.onSelect}
              className="whitespace-nowrap"
            >
              <action.icon />
              <span className="truncate">{action.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirming === 'revoke'}
        onOpenChange={closeDialog}
        title={t('admin.userActions.removeAdminTitle', { name })}
        description={t('admin.userActions.removeAdminDescription')}
        confirmLabel={t('admin.userActions.removeAdmin')}
        pending={revoke.isPending}
        onConfirm={() => revoke.mutate(params)}
      />
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
