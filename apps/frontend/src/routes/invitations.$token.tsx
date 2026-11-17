import { noop } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { AcceptInvitationPage } from '@/features/access/components/accept-invitation-page';
import { session } from '@/features/core/session';
import { profileQuery } from '@/features/users/profile';

export const Route = createFileRoute('/invitations/$token')({
  loader: ({ context: { queryClient } }) =>
    session.isAuthenticated()
      ? queryClient.query(profileQuery()).catch(noop)
      : undefined,
  component: AcceptInvitationPage,
});
