import { Alert, AlertDescription } from '@monorepo/ui/components/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@monorepo/ui/components/card'
import { Skeleton } from '@monorepo/ui/components/skeleton'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CircleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { AuditPagination } from '@/features/audit/components/audit-pagination'
import { AuditTimeline } from '@/features/audit/components/audit-timeline'
import { accountActivityQuery } from '@/features/audit/queries'
import { errorMessage } from '@/features/core/errors'
import { t } from '@/features/core/i18n'

export function AccountActivity() {
  const [page, setPage] = useState(1)
  const activity = useQuery({ ...accountActivityQuery(page), placeholderData: keepPreviousData })

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('audit.accountActivity.title')}</h2>
        </CardTitle>
        <CardDescription>{t('audit.accountActivity.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {activity.isPending && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        )}

        {activity.isError && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{errorMessage(activity.error)}</AlertDescription>
          </Alert>
        )}

        {activity.isSuccess && (
          <div className="flex flex-col gap-3">
            {activity.data.data.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                {t('audit.accountActivity.empty')}
              </p>
            ) : (
              <AuditTimeline events={activity.data.data} showSession />
            )}
            <AuditPagination metadata={activity.data.metadata} onPageChange={setPage} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
