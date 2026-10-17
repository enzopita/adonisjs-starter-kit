import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@monorepo/ui/components/empty'
import { CirclePauseIcon } from 'lucide-react'
import { t } from '@/features/core/i18n'

/** The switcher in the header stays usable, so a member of other workspaces moves on from here. */
export function SuspendedWorkspacePage({ name }: { name: string }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-4 md:p-6">
      <div className="rounded-xl border border-dashed">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CirclePauseIcon />
            </EmptyMedia>
            <EmptyTitle>
              <h1>{t('tenancy.suspendedPage.title', { name })}</h1>
            </EmptyTitle>
            <EmptyDescription>{t('tenancy.suspendedPage.description')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </main>
  )
}
