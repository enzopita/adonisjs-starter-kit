import { Badge } from '@monorepo/ui/components/badge';
import { Button } from '@monorepo/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@monorepo/ui/components/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@monorepo/ui/components/table';
import { useMutation, useSuspenseQueries } from '@tanstack/react-query';
import { MailIcon, MailPlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { InviteMemberDialog } from '@/features/access/components/invite-member-dialog';
import { RequirePermission } from '@/features/access/components/require-permission';
import { invitationsQuery, rolesQuery } from '@/features/access/queries';
import { queries, tenantHeaders } from '@/features/core/api';
import type { api } from '@/features/core/api';
import { ConfirmDialog } from '@/features/core/components/confirm-dialog';
import { PageHeader } from '@/features/core/components/page-header';
import { DATE_MEDIUM, formatDate, useTimeZone } from '@/features/core/datetime';
import { errorMessage } from '@/features/core/errors';
import { t } from '@/features/core/i18n';
import { useActiveTenant } from '@/features/tenancy/workspace';

type Invitation = Awaited<
  ReturnType<typeof api.access.invitations.index>
>['data'][number];

type Role = Awaited<ReturnType<typeof api.access.roles.index>>['data'][number];

function roleName(roles: readonly Role[], roleId: string | null) {
  return roleId === null
    ? null
    : (roles.find((role) => role.id === roleId)?.name ?? null);
}

/** The API always sets both dates; the nullable type here only reflects the column's general shape. */
function isExpired(expiresAt: string | null) {
  return expiresAt !== null && new Date(expiresAt).getTime() <= Date.now();
}

function formattedDate(value: string | null, timeZone: string | undefined) {
  return (
    formatDate(value, DATE_MEDIUM, timeZone) ??
    t('access.invitationsPage.noDate')
  );
}

export function InvitationsPage() {
  return (
    <RequirePermission permission="members.manage">
      <Invitations />
    </RequirePermission>
  );
}

function Invitations() {
  const { id: tenantId } = useActiveTenant();
  const timeZone = useTimeZone();

  const [{ data: invitations }, { data: roles }] = useSuspenseQueries({
    queries: [invitationsQuery(tenantId), rolesQuery(tenantId)],
  });

  const [inviting, setInviting] = useState(false);
  const [revoking, setRevoking] = useState<Invitation | null>(null);

  return (
    <>
      <PageHeader
        title={t('access.invitationsPage.title')}
        description={t('access.invitationsPage.description')}
        actions={
          <Button
            onClick={() => {
              setInviting(true);
            }}
          >
            <MailPlusIcon data-icon="inline-start" />
            {t('access.invitationsPage.inviteMember')}
          </Button>
        }
      />

      {invitations.data.length === 0 ? (
        <div className="rounded-xl border border-dashed">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MailIcon />
              </EmptyMedia>
              <EmptyTitle>
                <h2>{t('access.invitationsPage.noPending')}</h2>
              </EmptyTitle>
              <EmptyDescription>
                {t('access.invitationsPage.noPendingDescription')}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={() => {
                  setInviting(true);
                }}
              >
                <MailPlusIcon data-icon="inline-start" />
                {t('access.invitationsPage.inviteFirstMember')}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('access.invitationsPage.email')}</TableHead>
              <TableHead>{t('access.invitationsPage.role')}</TableHead>
              <TableHead className="hidden sm:table-cell">
                {t('access.invitationsPage.sent')}
              </TableHead>
              <TableHead>{t('access.invitationsPage.expires')}</TableHead>
              <TableHead>{t('access.invitationsPage.status')}</TableHead>
              <TableHead>
                <span className="sr-only">
                  {t('access.invitationsPage.actions')}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.data.map((invitation) => {
              const expired = isExpired(invitation.expiresAt);
              const name = roleName(roles.data, invitation.roleId);

              return (
                <TableRow key={invitation.id}>
                  <TableCell className="break-all">
                    {invitation.email}
                  </TableCell>
                  <TableCell>
                    {name === null ? (
                      <span className="text-muted-foreground">
                        {t('access.invitationsPage.noRole')}
                      </span>
                    ) : (
                      <Badge variant="secondary">{name}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-muted-foreground">
                      {formattedDate(invitation.createdAt, timeZone)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {formattedDate(invitation.expiresAt, timeZone)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={expired ? 'destructive' : 'secondary'}>
                      {expired
                        ? t('access.invitationsPage.expired')
                        : t('access.invitationsPage.pending')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t(
                        'access.invitationsPage.revokeInvitationTo',
                        {
                          email: invitation.email,
                        }
                      )}
                      onClick={() => {
                        setRevoking(invitation);
                      }}
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {inviting && (
        <InviteMemberDialog
          invitations={invitations.data}
          roles={roles.data}
          tenantId={tenantId}
          open
          onOpenChange={setInviting}
        />
      )}

      {revoking && (
        <RevokeInvitationDialog
          key={revoking.id}
          invitation={revoking}
          tenantId={tenantId}
          open
          onOpenChange={(open) => {
            if (!open) {
              setRevoking(null);
            }
          }}
        />
      )}
    </>
  );
}

function RevokeInvitationDialog({
  invitation,
  tenantId,
  open,
  onOpenChange,
}: {
  invitation: Invitation;
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const revokeInvitation = useMutation(
    queries.access.invitations.destroy.mutationOptions({
      onSuccess: () => {
        onOpenChange(false);
        toast.success(
          t('access.invitationsPage.revoked', { email: invitation.email })
        );
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('access.invitationsPage.revokeTitle', {
        email: invitation.email,
      })}
      description={t('access.invitationsPage.revokeDescription')}
      confirmLabel={t('access.invitationsPage.revokeConfirm')}
      pending={revokeInvitation.isPending}
      onConfirm={() => {
        revokeInvitation.mutate({
          params: { id: invitation.id },
          ...tenantHeaders(tenantId),
        });
      }}
    />
  );
}
