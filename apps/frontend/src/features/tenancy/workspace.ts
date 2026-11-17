import type { Data } from '@monorepo/backend/data';
import { getRouteApi } from '@tanstack/react-router';
import { z } from 'zod';
import { useStore } from 'zustand';

import { queries } from '@/features/core/api';
import { createPersistedStore } from '@/features/core/persisted-store';

const choice = z.object({ tenantId: z.uuid().nullable() });

/** The workspace last chosen in any tab: where a new tab starts. */
const lastChoiceStore = createPersistedStore('starter:last-workspace', choice, {
  tenantId: null,
});

/** This tab's workspace, so two tabs can each show their own; it survives a reload of the tab. */
const workspaceStore = createPersistedStore(
  'starter:workspace',
  choice,
  lastChoiceStore.getState(),
  () => sessionStorage
);

export function selectWorkspace(tenantId: string) {
  workspaceStore.setState({ tenantId });
  lastChoiceStore.setState({ tenantId });
}

export function useChosenTenantId() {
  return useStore(workspaceStore, (state) => state.tenantId);
}

export const tenantsQuery = () => queries.tenants.tenants.index.queryOptions();

/** The chosen workspace while the user still belongs to it, else their first; none before onboarding. */
export function activeTenant(
  tenants: readonly Data.Tenancy.Tenant[],
  tenantId: string | null
) {
  return tenants.find((tenant) => tenant.id === tenantId) ?? tenants[0] ?? null;
}

/** This tab's workspace among `tenants`, recorded so a reload of the tab keeps showing it. */
export function resolveTabWorkspace(tenants: readonly Data.Tenancy.Tenant[]) {
  const tenant = activeTenant(tenants, workspaceStore.getState().tenantId);

  if (tenant) {
    workspaceStore.setState({ tenantId: tenant.id });
  }

  return tenant;
}

const workspaceRoute = getRouteApi('/_app/_workspace');

/** The workspace a page inside the workspace layout renders. */
export function useActiveTenant() {
  return workspaceRoute.useRouteContext({
    select: (context) => context.tenant,
  });
}
