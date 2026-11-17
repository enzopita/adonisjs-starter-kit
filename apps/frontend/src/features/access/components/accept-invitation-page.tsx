import { buttonVariants } from '@monorepo/ui/components/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { logOut, queries } from '@/features/core/api';
import { AuthCard } from '@/features/core/components/auth-card';
import { PendingButton } from '@/features/core/components/pending-button';
import { apiErrorCode, errorMessage } from '@/features/core/errors';
import { t } from '@/features/core/i18n';
import { useIsAuthenticated } from '@/features/core/session';
import { selectWorkspace } from '@/features/tenancy/workspace';
import { profileQuery } from '@/features/users/profile';

const route = getRouteApi('/invitations/$token');

export function AcceptInvitationPage() {
  const { token } = route.useParams();
  const isAuthenticated = useIsAuthenticated();
  // A token the API no longer accepts signs the visitor out, who can then sign in again from here.
  const profile = useQuery({ ...profileQuery(), enabled: isAuthenticated });
  const navigate = useNavigate();
  const redirectSearch = { redirect: `/invitations/${token}` };

  const accept = useMutation(
    queries.invitationAccept.store.mutationOptions({
      onSuccess: async ({ data: tenant }) => {
        selectWorkspace(tenant.id);
        toast.success(
          t('access.acceptInvitationPage.joined', { name: tenant.name })
        );
        await navigate({ to: '/' });
      },
      onError: (error) => {
        if (apiErrorCode(error) === null) {
          toast.error(errorMessage(error));
        }
      },
    })
  );

  if (!isAuthenticated) {
    return (
      <AuthCard
        title={t('access.acceptInvitationPage.invitedTitle')}
        description={t('access.acceptInvitationPage.invitedDescription')}
      >
        <div className="flex flex-col gap-2">
          <Link
            to="/login"
            search={redirectSearch}
            className={buttonVariants({ size: 'lg' })}
          >
            {t('access.acceptInvitationPage.signIn')}
          </Link>
          <Link
            to="/signup"
            search={redirectSearch}
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            {t('access.acceptInvitationPage.createAccount')}
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (profile.error) {
    return (
      <AuthCard
        title={t('access.acceptInvitationPage.somethingWrong')}
        description={errorMessage(profile.error)}
      >
        <PendingButton
          size="lg"
          className="w-full"
          pending={profile.isFetching}
          onClick={() => {
            void profile.refetch();
          }}
        >
          {t('access.acceptInvitationPage.tryAgain')}
        </PendingButton>
      </AuthCard>
    );
  }

  const user = profile.data?.data;

  if (!user) {
    return null;
  }

  const failure = accept.error ? apiErrorCode(accept.error) : null;

  if (failure === 'E_INVITATION_NOT_FOUND') {
    return (
      <AuthCard
        title={t('access.acceptInvitationPage.notFoundTitle')}
        description={t('access.acceptInvitationPage.notFoundDescription')}
      >
        <Link
          to="/"
          className={buttonVariants({ size: 'lg', className: 'w-full' })}
        >
          {t('access.acceptInvitationPage.goHome')}
        </Link>
      </AuthCard>
    );
  }

  if (failure === 'E_INVITATION_EMAIL_MISMATCH') {
    const signInWithAnotherAccount = async () => {
      await logOut();
      await navigate({ to: '/login', search: redirectSearch });
    };

    return (
      <AuthCard
        title={t('access.acceptInvitationPage.wrongAccountTitle')}
        description={t('access.acceptInvitationPage.wrongAccountDescription', {
          email: user.email,
        })}
      >
        <PendingButton
          size="lg"
          className="w-full"
          pending={false}
          onClick={() => {
            void signInWithAnotherAccount();
          }}
        >
          {t('access.acceptInvitationPage.signInWithAnotherAccount')}
        </PendingButton>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t('access.acceptInvitationPage.acceptTitle')}
      description={t('access.acceptInvitationPage.signedInAs', {
        email: user.email,
      })}
    >
      <PendingButton
        size="lg"
        className="w-full"
        pending={accept.isPending}
        onClick={() => {
          accept.mutate({ body: { token } });
        }}
      >
        {t('access.acceptInvitationPage.acceptInvitation')}
      </PendingButton>
    </AuthCard>
  );
}
