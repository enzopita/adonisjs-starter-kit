import { Alert, AlertDescription } from '@monorepo/ui/components/alert';
import { Badge } from '@monorepo/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@monorepo/ui/components/card';
import { Skeleton } from '@monorepo/ui/components/skeleton';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CircleAlertIcon, MonitorIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { parseDeviceLabel } from '@/features/auth/device-label';
import { sessionsQuery } from '@/features/auth/sessions';
import { api, queries } from '@/features/core/api';
import { ConfirmDialog } from '@/features/core/components/confirm-dialog';
import { PendingButton } from '@/features/core/components/pending-button';
import {
  DATE_TIME_SHORT,
  formatDate,
  relativeTime,
  useTimeZone,
} from '@/features/core/datetime';
import { errorMessage } from '@/features/core/errors';
import { t } from '@/features/core/i18n';

type SessionRow = Awaited<
  ReturnType<typeof api.profile.sessions.index>
>['data'][number];

function deviceText(userAgent: string | null) {
  const { browser, os, raw } = parseDeviceLabel(userAgent);

  if (browser && os) return t('auth.sessionsCard.deviceBoth', { browser, os });

  if (browser) return browser;

  if (os) return os;

  return raw ?? t('auth.sessionsCard.unknownDevice');
}

/** The devices signed in to the user's account, each but this one with a sign-out action. */
export function SessionsCard() {
  const sessions = useQuery(sessionsQuery());
  const timeZone = useTimeZone();
  const [confirming, setConfirming] = useState<SessionRow | 'all' | null>(null);

  const closeDialog = (open: boolean) => {
    if (!open) setConfirming(null);
  };

  const revoke = useMutation(
    queries.profile.sessions.destroy.mutationOptions({
      onSuccess: () => {
        setConfirming(null);
        toast.success(t('auth.sessionsCard.signedOut'));
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  const revokeAll = useMutation(
    queries.profile.sessions.destroyAll.mutationOptions({
      onSuccess: ({ data }) => {
        setConfirming(null);
        toast.success(
          t('auth.sessionsCard.signedOutAll', { count: data.revoked })
        );
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  const otherSessions = sessions.data?.data.filter((row) => !row.current) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('auth.sessionsCard.title')}</h2>
        </CardTitle>
        <CardDescription>{t('auth.sessionsCard.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.isPending && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        )}

        {sessions.isError && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{errorMessage(sessions.error)}</AlertDescription>
          </Alert>
        )}

        {sessions.isSuccess && (
          <div className="flex flex-col gap-4">
            <ol className="flex flex-col divide-y">
              {sessions.data.data.map((row) => (
                <li key={row.id} className="flex items-center gap-3 py-3">
                  <MonitorIcon className="text-muted-foreground size-4 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {deviceText(row.userAgent)}
                      </span>
                      {row.current && (
                        <Badge variant="secondary">
                          {t('auth.sessionsCard.currentDevice')}
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {t('auth.sessionsCard.lastActive', {
                        time: row.lastUsedAt
                          ? relativeTime(new Date(row.lastUsedAt))
                          : (formatDate(
                              row.createdAt,
                              DATE_TIME_SHORT,
                              timeZone
                            ) ?? ''),
                      })}
                      {row.ipAddress && ` · ${row.ipAddress}`}
                    </span>
                  </div>
                  {!row.current && (
                    <PendingButton
                      variant="ghost"
                      size="sm"
                      pending={
                        revoke.isPending &&
                        revoke.variables?.params.id === row.id
                      }
                      disabled={revoke.isPending}
                      onClick={() => setConfirming(row)}
                    >
                      {t('auth.sessionsCard.signOut')}
                    </PendingButton>
                  )}
                </li>
              ))}
            </ol>

            {otherSessions.length > 0 && (
              <div>
                <PendingButton
                  variant="outline"
                  size="sm"
                  pending={revokeAll.isPending}
                  onClick={() => setConfirming('all')}
                >
                  {t('auth.sessionsCard.signOutAll')}
                </PendingButton>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirming !== null && confirming !== 'all'}
        onOpenChange={closeDialog}
        title={t('auth.sessionsCard.signOutTitle')}
        description={t('auth.sessionsCard.signOutDescription')}
        confirmLabel={t('auth.sessionsCard.signOut')}
        pending={revoke.isPending}
        onConfirm={() => {
          if (confirming && confirming !== 'all')
            revoke.mutate({ params: { id: confirming.id } });
        }}
      />
      <ConfirmDialog
        open={confirming === 'all'}
        onOpenChange={closeDialog}
        title={t('auth.sessionsCard.signOutAllTitle')}
        description={t('auth.sessionsCard.signOutAllDescription')}
        confirmLabel={t('auth.sessionsCard.signOutAll')}
        pending={revokeAll.isPending}
        onConfirm={() => revokeAll.mutate({})}
      />
    </Card>
  );
}
