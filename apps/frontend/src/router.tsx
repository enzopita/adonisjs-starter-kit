import type { QueryKey } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { TuyauError } from '@tuyau/core/client';

import { adminMeQuery } from '@/features/admin/queries';
import { apiErrorCode } from '@/features/core/errors';
import type { ApiErrorCode } from '@/features/core/errors';
import { queryClient } from '@/features/core/query-client';
import { sessionStore } from '@/features/core/session';
import { tenantsQuery } from '@/features/tenancy/workspace';
import { routeTree } from '@/routeTree.gen';

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  // TanStack Query owns caching; the router always asks it, and it answers from cache while fresh.
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

// Route guards decide where a session may be, so a sign-in or sign-out from this tab or another
// reruns them. Another account's cached data never outlives its token.
sessionStore.subscribe((state, previous) => {
  if (state.token === previous.token) return;

  queryClient.clear();
  void router.invalidate();
});

/**
 * A 403 whose code means a route guard decided on stale data: the query that guard reads. A
 * workspace suspended while a member has it open, or two-factor turned off in another tab for the
 * admin area, answers the next request this way. Rerunning the guard on a fresh copy sends the
 * user to /workspace-suspended or to the two-factor prompt.
 */
const RERUN_GUARD_ON: Partial<Record<ApiErrorCode, () => QueryKey>> = {
  E_TENANT_SUSPENDED: () => tenantsQuery().queryKey,
  E_TWO_FACTOR_REQUIRED: () => adminMeQuery().queryKey,
};

function rerunStaleGuard(error: Error | null) {
  if (!(error instanceof TuyauError) || error.status !== 403) return;

  const code = apiErrorCode(error);
  const queryKey = code && RERUN_GUARD_ON[code]?.();

  if (!queryKey) return;

  void queryClient
    .invalidateQueries({ queryKey, refetchType: 'none' })
    .then(() => router.invalidate());
}

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'error')
    rerunStaleGuard(event.action.error);
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === 'updated' && event.action.type === 'error')
    rerunStaleGuard(event.action.error);
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
