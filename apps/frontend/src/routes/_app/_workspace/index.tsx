import { createFileRoute } from '@tanstack/react-router';

import { OverviewPage } from '@/features/access/components/overview-page';

export const Route = createFileRoute('/_app/_workspace/')({
  component: OverviewPage,
});
