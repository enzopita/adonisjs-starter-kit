import { Avatar, AvatarFallback } from '@monorepo/ui/components/avatar';
import { Badge } from '@monorepo/ui/components/badge';
import { CogIcon, ShieldAlertIcon } from 'lucide-react';

import { describeEvent } from '@/features/audit/event-text';
import type {
  AuditEventRow,
  PermissionLabel,
} from '@/features/audit/event-text';
import {
  DATE_TIME_MEDIUM,
  formatDate,
  relativeTime,
  useTimeZone,
} from '@/features/core/datetime';
import { displayName } from '@/features/core/display-name';
import { t } from '@/features/core/i18n';
import { UserAvatar } from '@/features/users/components/user-avatar';

type Actor = NonNullable<AuditEventRow['actor']>;

const rawPermission: PermissionLabel = (permission) => permission;

/**
 * A trail of audit events, newest first as the API lists them. With `onActorSelect`, each actor's
 * name filters the trail to that person. With `showSession`, each row shows where it came from
 * without opening its details. `permissionLabel` names the permissions a workspace event changed.
 */
export function AuditTimeline({
  events,
  permissionLabel = rawPermission,
  onActorSelect,
  showSession = false,
}: {
  events: readonly AuditEventRow[];
  permissionLabel?: PermissionLabel;
  onActorSelect?: (actor: Actor) => void;
  showSession?: boolean;
}) {
  return (
    <ol className="flex flex-col divide-y">
      {events.map((row) => (
        <AuditTimelineItem
          key={row.id}
          row={row}
          permissionLabel={permissionLabel}
          onActorSelect={onActorSelect}
          showSession={showSession}
        />
      ))}
    </ol>
  );
}

function AuditTimelineItem({
  row,
  permissionLabel,
  onActorSelect,
  showSession,
}: {
  row: AuditEventRow;
  permissionLabel: PermissionLabel;
  onActorSelect?: (actor: Actor) => void;
  showSession: boolean;
}) {
  const { actor, session } = row;

  const { sentence, standalone, permissions } = describeEvent(
    row,
    permissionLabel
  );

  const timeZone = useTimeZone();
  const createdAt = row.createdAt === null ? null : new Date(row.createdAt);
  const absolute = formatDate(row.createdAt, DATE_TIME_MEDIUM, timeZone);

  return (
    <li className="flex gap-3 py-3">
      {actor && standalone !== true ? (
        <UserAvatar user={actor} className="size-7" />
      ) : (
        <Avatar className="size-7">
          <AvatarFallback>
            {standalone ? (
              <ShieldAlertIcon className="size-3.5" />
            ) : (
              <CogIcon className="size-3.5" />
            )}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="min-w-0 text-xs/relaxed">
            {standalone !== true && (
              <>
                <Byline actor={actor} onActorSelect={onActorSelect} />{' '}
              </>
            )}
            {sentence}
            {row.impersonator && (
              <span className="text-muted-foreground">
                {' '}
                {t('audit.timeline.impersonatedBy', {
                  name: displayName(row.impersonator),
                })}
              </span>
            )}
          </p>
          {createdAt && (
            <time
              dateTime={createdAt.toISOString()}
              title={absolute ?? undefined}
              className="text-muted-foreground shrink-0 text-xs"
            >
              {relativeTime(createdAt)}
            </time>
          )}
        </div>

        {showSession && (
          <p
            className="text-muted-foreground truncate text-xs"
            title={session.userAgent ?? undefined}
          >
            {t('audit.timeline.from', {
              ip: session.ip ?? t('audit.timeline.none'),
              browser: session.userAgent ?? t('audit.timeline.none'),
            })}
          </p>
        )}

        <details className="group text-xs">
          <summary className="text-muted-foreground hover:text-foreground w-fit cursor-pointer select-none">
            {t('audit.timeline.details')}
          </summary>
          <dl className="bg-muted/50 mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md p-2">
            {permissions && permissions.added.length > 0 && (
              <PermissionList
                label={t('audit.timeline.added')}
                permissions={permissions.added}
                permissionLabel={permissionLabel}
              />
            )}
            {permissions && permissions.removed.length > 0 && (
              <PermissionList
                label={t('audit.timeline.removed')}
                permissions={permissions.removed}
                permissionLabel={permissionLabel}
              />
            )}
            <Detail label={t('audit.timeline.when')} value={absolute} />
            <Detail label={t('audit.timeline.ip')} value={session.ip} />
            <Detail
              label={t('audit.timeline.userAgent')}
              value={session.userAgent}
            />
            <Detail
              label={t('audit.timeline.requestId')}
              value={session.requestId}
              mono
            />
            <Detail
              label={t('audit.timeline.sessionId')}
              value={session.id}
              mono
            />
          </dl>
        </details>
      </div>
    </li>
  );
}

function Byline({
  actor,
  onActorSelect,
}: {
  actor: Actor | null;
  onActorSelect?: (actor: Actor) => void;
}) {
  if (!actor) {
    return <span className="font-medium">{t('audit.timeline.system')}</span>;
  }

  if (!onActorSelect) {
    return <span className="font-medium">{displayName(actor)}</span>;
  }

  return (
    <button
      type="button"
      className="font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      title={t('audit.timeline.showOnly', { name: displayName(actor) })}
      onClick={() => {
        onActorSelect(actor);
      }}
    >
      {displayName(actor)}
    </button>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono break-all' : 'break-words'}>
        {value ?? t('audit.timeline.none')}
      </dd>
    </>
  );
}

function PermissionList({
  label,
  permissions,
  permissionLabel,
}: {
  label: string;
  permissions: string[];
  permissionLabel: PermissionLabel;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <ul className="flex flex-wrap gap-1">
          {permissions.map((permission) => (
            <li key={permission}>
              <Badge variant="secondary">{permissionLabel(permission)}</Badge>
            </li>
          ))}
        </ul>
      </dd>
    </>
  );
}
