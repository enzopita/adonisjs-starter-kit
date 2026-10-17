import { Button } from '@monorepo/ui/components/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { api } from '@/features/core/api'
import { t } from '@/features/core/i18n'

type Metadata = Awaited<ReturnType<typeof api.audit.auditEvents.index>>['metadata']

export function AuditPagination({
  metadata,
  onPageChange,
}: {
  metadata: Metadata
  onPageChange: (page: number) => void
}) {
  const { currentPage, lastPage, perPage, total } = metadata

  if (lastPage <= 1) return null

  return (
    <nav
      aria-label={t('audit.pagination.label')}
      className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"
    >
      <span className="text-xs text-muted-foreground">
        {t('audit.pagination.range', {
          from: (currentPage - 1) * perPage + 1,
          to: Math.min(currentPage * perPage, total),
          total,
        })}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          {t('audit.pagination.previous')}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t('audit.pagination.page', { page: currentPage, pages: lastPage })}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {t('audit.pagination.next')}
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  )
}
