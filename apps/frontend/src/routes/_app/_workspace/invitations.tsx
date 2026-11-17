import { createFileRoute } from '@tanstack/react-router';

import { InvitationsPage } from '@/features/access/components/invitations-page';
import { can } from '@/features/access/permissions';
import {
  invitationsQuery,
  myPermissionsQuery,
  rolesQuery,
} from '@/features/access/queries';

export const Route = createFileRoute('/_app/_workspace/invitations')({
  loader: async ({ context: { queryClient, tenant } }) => {
    const {
      data: { permissions },
    } = await queryClient.query(myPermissionsQuery(tenant.id));

    if (!can(permissions, 'members.manage')) {
      return;
    }

    await Promise.all([
      queryClient.query(invitationsQuery(tenant.id)),
      queryClient.query(rolesQuery(tenant.id)),
    ]);
  },
  component: InvitationsPage,
});
