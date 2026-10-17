import { Avatar, AvatarFallback } from '@monorepo/ui/components/avatar'
import { Badge } from '@monorepo/ui/components/badge'
import { CogIcon, ShieldAlertIcon } from 'lucide-react'
import { describeEvent } from '@/features/audit/event-text'
import type { AuditEventRow, PermissionLabel } from '@/features/audit/event-text'
import { locale, t } from '@/features/core/i18n'
import { UserAvatar } from '@/features/users/components/user-avatar'

type Actor = NonNullable<AuditEventRow['actor']>

const absoluteFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'medium' })

const relativeFormat = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
]

function relativeTime(date: Date) {
  const seconds = (date.getTime() - Date.now()) / 1000

  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit)
  }

  return relativeFormat.format(0, 'second')
}

const actorName = (actor: Actor) => actor.fullName ?? actor.email

const rawPermission: PermissionLabel = permission => permission

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
  events: readonly AuditEventRow[]
  permissionLabel?: PermissionLabel
  onActorSelect?: (actor: Actor) => void
  showSession?: boolean
}) {
  return (
    <ol className="flex flex-col divide-y">
      {events.map(row => (
        <AuditTimelineItem
          key={row.id}
          row={row}
          permissionLabel={permissionLabel}
          onActorSelect={onActorSelect}
          showSession={showSession}
        />
      ))}
    </ol>
  )
}

function AuditTimelineItem({
  row,
  permissionLabel,
  onActorSelect,
  showSession,
}: {
  row: AuditEventRow
  permissionLabel: PermissionLabel
  onActorSelect?: (actor: Actor) => void
  showSession: boolean
}) {
  const { actor, session } = row
  const { sentence, standalone, permissions } = describeEvent(row.event, permissionLabel)
  const createdAt = row.createdAt ? new Date(row.createdAt) : null

  return (
    <li className="flex gap-3 py-3">
      {actor && !standalone ? (
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
            {!standalone && (
              <>
                <Byline actor={actor} onActorSelect={onActorSelect} />{' '}
              </>
            )}
            {sentence}
          </p>
          {createdAt && (
            <time
              dateTime={createdAt.toISOString()}
              title={absoluteFormat.format(createdAt)}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {relativeTime(createdAt)}
            </time>
          )}
        </div>

        {showSession && (
          <p
            className="truncate text-xs text-muted-foreground"
            title={session.userAgent ?? undefined}
          >
            {t('audit.timeline.from', {
              ip: session.ip ?? t('audit.timeline.none'),
              browser: session.userAgent ?? t('audit.timeline.none'),
            })}
          </p>
        )}

        <details className="group text-xs">
          <summary className="w-fit cursor-pointer text-muted-foreground select-none hover:text-foreground">
            {t('audit.timeline.details')}
          </summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md bg-muted/50 p-2">
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
            <Detail
              label={t('audit.timeline.when')}
              value={createdAt && absoluteFormat.format(createdAt)}
            />
            <Detail label={t('audit.timeline.ip')} value={session.ip} />
            <Detail label={t('audit.timeline.userAgent')} value={session.userAgent} />
            <Detail label={t('audit.timeline.requestId')} value={session.requestId} mono />
            <Detail label={t('audit.timeline.sessionId')} value={session.id} mono />
          </dl>
        </details>
      </div>
    </li>
  )
}

function Byline({
  actor,
  onActorSelect,
}: {
  actor: Actor | null
  onActorSelect?: (actor: Actor) => void
}) {
  if (!actor) return <span className="font-medium">{t('audit.timeline.system')}</span>

  if (!onActorSelect) return <span className="font-medium">{actorName(actor)}</span>

  return (
    <button
      type="button"
      className="font-medium underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
      title={t('audit.timeline.showOnly', { name: actorName(actor) })}
      onClick={() => onActorSelect(actor)}
    >
      {actorName(actor)}
    </button>
  )
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string | null
  mono?: boolean
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono break-all' : 'break-words'}>
        {value ?? t('audit.timeline.none')}
      </dd>
    </>
  )
}

function PermissionList({
  label,
  permissions,
  permissionLabel,
}: {
  label: string
  permissions: string[]
  permissionLabel: PermissionLabel
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <ul className="flex flex-wrap gap-1">
          {permissions.map(permission => (
            <li key={permission}>
              <Badge variant="secondary">{permissionLabel(permission)}</Badge>
            </li>
          ))}
        </ul>
      </dd>
    </>
  )
}
