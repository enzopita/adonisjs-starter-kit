import { queries, tenantHeaders } from '@/features/core/api';

export const myPermissionsQuery = (tenantId: string) =>
  queries.access.myPermissions.show.queryOptions(tenantHeaders(tenantId));

export const permissionCatalogQuery = (tenantId: string) =>
  queries.access.permissionCatalog.show.queryOptions(tenantHeaders(tenantId));

export const rolesQuery = (tenantId: string) =>
  queries.access.roles.index.queryOptions(tenantHeaders(tenantId));

export const membersQuery = (tenantId: string) =>
  queries.access.members.index.queryOptions(tenantHeaders(tenantId));

export const invitationsQuery = (tenantId: string) =>
  queries.access.invitations.index.queryOptions(tenantHeaders(tenantId));
