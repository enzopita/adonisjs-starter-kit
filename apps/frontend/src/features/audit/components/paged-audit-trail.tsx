import { Alert, AlertDescription } from '@monorepo/ui/components/alert';
import { Skeleton } from '@monorepo/ui/components/skeleton';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import type { TuyauError } from '@tuyau/core/client';
import { CircleAlertIcon } from 'lucide-react';
import { useState } from 'react';
import type { ComponentProps } from 'react';

import { AuditTimeline } from '@/features/audit/components/audit-timeline';
import type { AuditEventRow } from '@/features/audit/event-text';
import { Pagination } from '@/features/core/components/pagination';
import { errorMessage } from '@/features/core/errors';

type TrailPage = {
  data: AuditEventRow[];
  metadata: ComponentProps<typeof Pagination>['metadata'];
};

/** A trail one page at a time, keeping the current page on screen while the next one loads. */
export function PagedAuditTrail<
  Page extends TrailPage,
  Err extends TuyauError,
  Key extends QueryKey,
>({
  query,
  empty,
  scrollable = false,
  ...timeline
}: {
  query: (page: number) => UseQueryOptions<Page, Err, Page, Key>;
  empty: string;
  /** Caps the list's height, for a trail inside a dialog. */
  scrollable?: boolean;
} & Omit<ComponentProps<typeof AuditTimeline>, 'events'>) {
  const [page, setPage] = useState(1);
  const trail = useQuery({ ...query(page), placeholderData: keepPreviousData });

  if (trail.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    );
  }

  if (trail.isError) {
    return (
      <Alert variant="destructive">
        <CircleAlertIcon />
        <AlertDescription>{errorMessage(trail.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div
      className={
        scrollable
          ? 'flex max-h-[60vh] flex-col gap-3 overflow-y-auto'
          : 'flex flex-col gap-3'
      }
    >
      {trail.data.data.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-xs">
          {empty}
        </p>
      ) : (
        <AuditTimeline events={trail.data.data} {...timeline} />
      )}
      <Pagination metadata={trail.data.metadata} onPageChange={setPage} />
    </div>
  );
}
