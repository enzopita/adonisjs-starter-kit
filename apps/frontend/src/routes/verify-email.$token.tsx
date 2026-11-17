import { noop, useQuery } from '@tanstack/react-query';
import { createFileRoute, getRouteApi } from '@tanstack/react-router';

import { VerifyEmailPage } from '@/features/auth/components/verify-email-page';
import { session, useIsAuthenticated } from '@/features/core/session';
import { profileQuery } from '@/features/users/profile';

export const Route = createFileRoute('/verify-email/$token')({
  loader: ({ context: { queryClient } }) =>
    session.isAuthenticated()
      ? queryClient.query(profileQuery()).catch(noop)
      : undefined,
  component: VerifyEmailRoute,
});

const route = getRouteApi('/verify-email/$token');

/** Reads the profile here, not in `auth`'s page, since `auth` may not import `users`. */
function VerifyEmailRoute() {
  const { token } = route.useParams();
  const isAuthenticated = useIsAuthenticated();
  const profile = useQuery({ ...profileQuery(), enabled: isAuthenticated });

  return (
    <VerifyEmailPage
      token={token}
      isAuthenticated={isAuthenticated}
      verifiedAt={profile.data?.data.emailVerifiedAt}
    />
  );
}
