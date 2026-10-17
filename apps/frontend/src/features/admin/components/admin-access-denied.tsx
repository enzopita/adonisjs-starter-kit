import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@monorepo/ui/components/empty'
import { LockIcon } from 'lucide-react'
import { t } from '@/features/core/i18n'

export function AdminAccessDenied() {
  return (
    <div className="rounded-xl border border-dashed">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockIcon />
          </EmptyMedia>
          <EmptyTitle>
            <h1>{t('admin.accessDenied.title')}</h1>
          </EmptyTitle>
          <EmptyDescription>{t('admin.accessDenied.description')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
