import { createFileRoute } from '@tanstack/react-router';

import { RolesPage } from '@/features/access/components/roles-page';
import { can } from '@/features/access/permissions';
import {
  membersQuery,
  myPermissionsQuery,
  permissionCatalogQuery,
  rolesQuery,
} from '@/features/access/queries';

export const Route = createFileRoute('/_app/_workspace/roles')({
  loader: async ({ context: { queryClient, tenant } }) => {
    const { permissions } = (
      await queryClient.query(myPermissionsQuery(tenant.id))
    ).data;

    if (!can(permissions, 'roles.manage')) return;

    await Promise.all([
      queryClient.query(rolesQuery(tenant.id)),
      queryClient.query(permissionCatalogQuery(tenant.id)),
      can(permissions, 'members.manage') &&
        queryClient.query(membersQuery(tenant.id)),
    ]);
  },
  component: RolesPage,
});
