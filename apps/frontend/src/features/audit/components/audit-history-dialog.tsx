import { Alert, AlertDescription } from '@monorepo/ui/components/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@monorepo/ui/components/dialog'
import { Skeleton } from '@monorepo/ui/components/skeleton'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CircleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { AuditPagination } from '@/features/audit/components/audit-pagination'
import { AuditTimeline } from '@/features/audit/components/audit-timeline'
import type { AuditSubject, PermissionLabel } from '@/features/audit/event-text'
import { EMBEDDED_PER_PAGE, auditEventsQuery } from '@/features/audit/queries'
import { errorMessage } from '@/features/core/errors'
import { t } from '@/features/core/i18n'

/** One record's trail. The API lets its feature's permission read it without audit.view. */
export function AuditHistoryDialog({
  subject,
  name,
  tenantId,
  permissionLabel,
  open,
  onOpenChange,
}: {
  subject: AuditSubject
  name: string
  tenantId: string
  permissionLabel: PermissionLabel
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [page, setPage] = useState(1)

  const history = useQuery({
    ...auditEventsQuery(tenantId, { subject, page, perPage: EMBEDDED_PER_PAGE }),
    placeholderData: keepPreviousData,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('audit.historyDialog.close')} className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('audit.historyDialog.title', { name })}</DialogTitle>
          <DialogDescription>{t('audit.historyDialog.description')}</DialogDescription>
        </DialogHeader>

        {history.isPending && (
          <div className="flex flex-col gap-3 py-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        )}

        {history.isError && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{errorMessage(history.error)}</AlertDescription>
          </Alert>
        )}

        {history.isSuccess && (
          <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
            {history.data.data.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                {t('audit.historyDialog.empty')}
              </p>
            ) : (
              <AuditTimeline events={history.data.data} permissionLabel={permissionLabel} />
            )}
            <AuditPagination metadata={history.data.metadata} onPageChange={setPage} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
