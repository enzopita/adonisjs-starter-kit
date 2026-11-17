import { Badge } from '@monorepo/ui/components/badge';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  BanIcon,
  CircleCheckIcon,
  KeyRoundIcon,
  ShieldMinusIcon,
  ShieldPlusIcon,
  VenetianMaskIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { RowActionsMenu } from '@/features/admin/components/row-actions-menu';
import type { RowAction } from '@/features/admin/components/row-actions-menu';
import { queries } from '@/features/core/api';
import { ConfirmDialog } from '@/features/core/components/confirm-dialog';
import { displayName } from '@/features/core/display-name';
import { errorMessage } from '@/features/core/errors';
import { t } from '@/features/core/i18n';
import { session } from '@/features/core/session';
import { profileQuery } from '@/features/users/profile';

export type AdminUserRow = {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    twoFactorEnabled: boolean;
  };
  disabledAt: string | null;
  platformAdmin: boolean;
};

export function UserStatus({ row }: { row: AdminUserRow }) {
  if (row.platformAdmin) {
    return <Badge variant="secondary">{t('admin.userActions.admin')}</Badge>;
  }

  if (row.disabledAt) {
    return (
      <Badge variant="destructive">{t('admin.userActions.disabled')}</Badge>
    );
  }

  return <Badge variant="outline">{t('admin.userActions.active')}</Badge>;
}

export function TwoFactorStatus({ row }: { row: AdminUserRow }) {
  if (row.user.twoFactorEnabled) {
    return <Badge variant="outline">{t('admin.usersPage.twoFactorOn')}</Badge>;
  }

  return (
    <span className="text-muted-foreground">
      {t('admin.usersPage.twoFactorOff')}
    </span>
  );
}

type Confirming = 'disable' | 'grant' | 'revoke' | 'resetTwoFactor' | null;

/** A platform admin can only lose the role, and never from themself: the API refuses the rest. */
export function UserActions({ row }: { row: AdminUserRow }) {
  const name = displayName(row.user);
  const navigate = useNavigate();
  const { data: me } = useSuspenseQuery(profileQuery());
  const [confirming, setConfirming] = useState<Confirming>(null);

  const closeDialog = (open: boolean) => {
    if (!open) {
      setConfirming(null);
    }
  };

  const impersonate = useMutation(
    queries.admin.impersonations.store.mutationOptions({
      onSuccess: async ({ data }) => {
        session.impersonate(data.token);
        await navigate({ to: '/' });
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  const enable = useMutation(
    queries.admin.userSuspensions.destroy.mutationOptions({
      onSuccess: () => toast.success(t('admin.userActions.enabled', { name })),
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  const disable = useMutation(
    queries.admin.userSuspensions.store.mutationOptions({
      onSuccess: () => {
        setConfirming(null);
        toast.success(t('admin.userActions.disabledToast', { name }));
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  const grant = useMutation(
    queries.admin.platformAdmins.store.mutationOptions({
      onSuccess: () => {
        setConfirming(null);
        toast.success(t('admin.userActions.madeAdmin', { name }));
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  const revoke = useMutation(
    queries.admin.platformAdmins.destroy.mutationOptions({
      onSuccess: () => {
        setConfirming(null);
        toast.success(t('admin.userActions.removedAdmin', { name }));
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  const resetTwoFactor = useMutation(
    queries.admin.twoFactorResets.destroy.mutationOptions({
      onSuccess: () => {
        setConfirming(null);
        toast.success(t('admin.userActions.resetTwoFactorToast', { name }));
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  const params = { params: { id: row.user.id } };
  const isSelf = row.user.id === me.data.id;

  if (row.platformAdmin && isSelf) {
    return null;
  }

  // The API refuses a platform admin's (`node ace admin:reset-two-factor` covers them) and a
  // disabled user's.
  const resetAction: RowAction[] = row.user.twoFactorEnabled
    ? [
        {
          key: 'resetTwoFactor',
          label: t('admin.userActions.resetTwoFactor'),
          icon: KeyRoundIcon,
          destructive: true,
          onSelect: () => {
            setConfirming('resetTwoFactor');
          },
        },
      ]
    : [];

  function rowActions(): RowAction[] {
    if (row.platformAdmin) {
      return [
        {
          key: 'removeAdmin',
          label: t('admin.userActions.removeAdmin'),
          icon: ShieldMinusIcon,
          destructive: true,
          onSelect: () => {
            setConfirming('revoke');
          },
        },
      ];
    }

    if (row.disabledAt) {
      return [
        {
          key: 'enable',
          label: t('admin.userActions.enable'),
          icon: CircleCheckIcon,
          disabled: enable.isPending,
          onSelect: () => {
            enable.mutate(params);
          },
        },
      ];
    }

    return [
      {
        key: 'impersonate',
        label: t('admin.userActions.impersonate'),
        icon: VenetianMaskIcon,
        disabled: impersonate.isPending,
        onSelect: () => {
          impersonate.mutate(params);
        },
      },
      {
        key: 'makeAdmin',
        label: t('admin.userActions.makeAdmin'),
        icon: ShieldPlusIcon,
        onSelect: () => {
          setConfirming('grant');
        },
      },
      ...resetAction,
      {
        key: 'disable',
        label: t('admin.userActions.disable'),
        icon: BanIcon,
        destructive: true,
        onSelect: () => {
          setConfirming('disable');
        },
      },
    ];
  }

  const actions = rowActions();

  return (
    <div className="flex justify-end">
      <RowActionsMenu
        label={t('admin.userActions.actionsFor', { name })}
        actions={actions}
      />

      <ConfirmDialog
        open={confirming === 'revoke'}
        onOpenChange={closeDialog}
        title={t('admin.userActions.removeAdminTitle', { name })}
        description={t('admin.userActions.removeAdminDescription')}
        confirmLabel={t('admin.userActions.removeAdmin')}
        pending={revoke.isPending}
        onConfirm={() => {
          revoke.mutate(params);
        }}
      />
      <ConfirmDialog
        open={confirming === 'grant'}
        onOpenChange={closeDialog}
        title={t('admin.userActions.makeAdminTitle', { name })}
        description={t('admin.userActions.makeAdminDescription')}
        confirmLabel={t('admin.userActions.makeAdmin')}
        pending={grant.isPending}
        onConfirm={() => {
          grant.mutate(params);
        }}
      />
      <ConfirmDialog
        open={confirming === 'resetTwoFactor'}
        onOpenChange={closeDialog}
        title={t('admin.userActions.resetTwoFactorTitle', { name })}
        description={t('admin.userActions.resetTwoFactorDescription')}
        confirmLabel={t('admin.userActions.resetTwoFactor')}
        pending={resetTwoFactor.isPending}
        onConfirm={() => {
          resetTwoFactor.mutate(params);
        }}
      />
      <ConfirmDialog
        open={confirming === 'disable'}
        onOpenChange={closeDialog}
        title={t('admin.userActions.disableTitle', { name })}
        description={t('admin.userActions.disableDescription')}
        confirmLabel={t('admin.userActions.disable')}
        pending={disable.isPending}
        onConfirm={() => {
          disable.mutate(params);
        }}
      />
    </div>
  );
}
