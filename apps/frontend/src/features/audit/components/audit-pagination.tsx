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
  const { currentPage, lastPage } = metadata

  if (lastPage <= 1) return null

  return (
    <nav aria-label={t('audit.pagination.label')} className="flex items-center justify-end gap-2">
      <span className="text-xs text-muted-foreground">
        {t('audit.pagination.page', { page: currentPage, pages: lastPage })}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={t('audit.pagination.previous')}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeftIcon />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={t('audit.pagination.next')}
        disabled={currentPage >= lastPage}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRightIcon />
      </Button>
    </nav>
  )
}
