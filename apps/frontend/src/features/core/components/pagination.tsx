import { Button } from '@monorepo/ui/components/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { t } from '@/features/core/i18n'

type Metadata = { currentPage: number; lastPage: number; perPage: number; total: number }

export function Pagination({
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
      aria-label={t('core.pagination.label')}
      className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"
    >
      <span className="text-xs text-muted-foreground">
        {t('core.pagination.range', {
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
          {t('core.pagination.previous')}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t('core.pagination.page', { page: currentPage, pages: lastPage })}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {t('core.pagination.next')}
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  )
}
