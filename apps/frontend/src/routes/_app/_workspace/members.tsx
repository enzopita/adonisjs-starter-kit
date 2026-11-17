import { createFileRoute } from '@tanstack/react-router';

import { MembersPage } from '@/features/access/components/members-page';
import { can } from '@/features/access/permissions';
import {
  membersQuery,
  myPermissionsQuery,
  permissionCatalogQuery,
  rolesQuery,
} from '@/features/access/queries';

export const Route = createFileRoute('/_app/_workspace/members')({
  loader: async ({ context: { queryClient, tenant } }) => {
    const {
      data: { permissions },
    } = await queryClient.query(myPermissionsQuery(tenant.id));

    if (!can(permissions, 'members.manage')) {
      return;
    }

    await Promise.all([
      queryClient.query(membersQuery(tenant.id)),
      queryClient.query(rolesQuery(tenant.id)),
      queryClient.query(permissionCatalogQuery(tenant.id)),
    ]);
  },
  component: MembersPage,
});
