import { Button } from '@monorepo/ui/components/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@monorepo/ui/components/empty'
import { Field, FieldLabel } from '@monorepo/ui/components/field'
import { Input } from '@monorepo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@monorepo/ui/components/select'
import { useSuspenseQuery } from '@tanstack/react-query'
import { HistoryIcon, XIcon } from 'lucide-react'
import { useId } from 'react'
import { AuditPagination } from '@/features/audit/components/audit-pagination'
import { AuditTimeline } from '@/features/audit/components/audit-timeline'
import type { PermissionLabel } from '@/features/audit/components/audit-timeline'
import {
  AUDIT_AREAS,
  AUDIT_EVENT_TYPES,
  areaLabel,
  areaOf,
  eventTypeLabel,
} from '@/features/audit/event-text'
import type { AuditArea } from '@/features/audit/event-text'
import { auditEventsQuery, auditSearchSchema } from '@/features/audit/queries'
import type { AuditSearch } from '@/features/audit/queries'
import { PageHeader } from '@/features/core/components/page-header'
import { t } from '@/features/core/i18n'
import { useActiveTenant } from '@/features/tenancy/workspace'

const ALL_EVENTS = 'all'

const typesIn = (area: AuditArea) => AUDIT_EVENT_TYPES.filter(type => areaOf(type) === area)

const EVENT_ITEMS = [
  { value: ALL_EVENTS, label: t('audit.auditPage.allEvents') },
  ...AUDIT_AREAS.flatMap(area => [
    { value: area, label: t('audit.auditPage.allInArea', { area: areaLabel(area) }) },
    ...typesIn(area).map(type => ({ value: type, label: eventTypeLabel(type) })),
  ]),
]

/** The workspace's whole trail, filtered by the URL's search params, which `search` holds. */
export function AuditPage({
  search,
  onSearchChange,
  permissionLabel,
}: {
  search: AuditSearch
  onSearchChange: (search: AuditSearch) => void
  permissionLabel: PermissionLabel
}) {
  const { id: tenantId } = useActiveTenant()
  const { data: events } = useSuspenseQuery(auditEventsQuery(tenantId, search))
  const eventId = useId()
  const fromId = useId()
  const toId = useId()

  const filter = (next: AuditSearch) => onSearchChange({ ...search, page: undefined, ...next })
  const filtered = Boolean(search.event || search.actor || search.from || search.to)
  const actor = search.actor && events.data.find(row => row.actor?.id === search.actor)?.actor

  return (
    <>
      <PageHeader
        title={t('audit.auditPage.title')}
        description={t('audit.auditPage.description')}
      />

      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-auto">
          <FieldLabel htmlFor={eventId}>{t('audit.auditPage.event')}</FieldLabel>
          <Select
            items={EVENT_ITEMS}
            value={search.event ?? ALL_EVENTS}
            onValueChange={value =>
              filter({ event: auditSearchSchema.shape.event.parse(value ?? undefined) })
            }
          >
            <SelectTrigger id={eventId} className="min-w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_EVENTS}>{t('audit.auditPage.allEvents')}</SelectItem>
              {AUDIT_AREAS.map(area => (
                <SelectGroup key={area}>
                  <SelectLabel>{areaLabel(area)}</SelectLabel>
                  <SelectItem value={area}>
                    {t('audit.auditPage.allInArea', { area: areaLabel(area) })}
                  </SelectItem>
                  {typesIn(area).map(type => (
                    <SelectItem key={type} value={type}>
                      {eventTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field className="w-auto">
          <FieldLabel htmlFor={fromId}>{t('audit.auditPage.from')}</FieldLabel>
          <Input
            id={fromId}
            type="date"
            value={search.from ?? ''}
            max={search.to}
            onChange={event => filter({ from: event.target.value || undefined })}
          />
        </Field>

        <Field className="w-auto">
          <FieldLabel htmlFor={toId}>{t('audit.auditPage.to')}</FieldLabel>
          <Input
            id={toId}
            type="date"
            value={search.to ?? ''}
            min={search.from}
            onChange={event => filter({ to: event.target.value || undefined })}
          />
        </Field>

        {search.actor && (
          <Button
            variant="secondary"
            title={t('audit.auditPage.removeActor')}
            onClick={() => filter({ actor: undefined })}
          >
            {actor
              ? t('audit.auditPage.actor', { name: actor.fullName ?? actor.email })
              : t('audit.auditPage.someone')}
            <XIcon data-icon="inline-end" />
          </Button>
        )}

        {filtered && (
          <Button variant="ghost" onClick={() => onSearchChange({})}>
            {t('audit.auditPage.clear')}
          </Button>
        )}
      </div>

      {events.data.length === 0 ? (
        <div className="rounded-xl border border-dashed">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HistoryIcon />
              </EmptyMedia>
              <EmptyTitle>
                <h2>
                  {filtered ? t('audit.auditPage.noMatchTitle') : t('audit.auditPage.emptyTitle')}
                </h2>
              </EmptyTitle>
              <EmptyDescription>
                {filtered
                  ? t('audit.auditPage.noMatchDescription')
                  : t('audit.auditPage.emptyDescription')}
              </EmptyDescription>
            </EmptyHeader>
            {filtered && (
              <EmptyContent>
                <Button variant="outline" onClick={() => onSearchChange({})}>
                  {t('audit.auditPage.clear')}
                </Button>
              </EmptyContent>
            )}
          </Empty>
        </div>
      ) : (
        <div className="rounded-xl border px-4">
          <AuditTimeline
            events={events.data}
            permissionLabel={permissionLabel}
            onActorSelect={selected => filter({ actor: selected.id })}
          />
        </div>
      )}

      <AuditPagination
        metadata={events.metadata}
        onPageChange={page => onSearchChange({ ...search, page })}
      />
    </>
  )
}
