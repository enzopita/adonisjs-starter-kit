import { Button, buttonVariants } from '@monorepo/ui/components/button';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useEffectEvent, useRef } from 'react';
import { toast } from 'sonner';

import { queries } from '@/features/core/api';
import { AuthCard } from '@/features/core/components/auth-card';
import { PendingButton } from '@/features/core/components/pending-button';
import { apiErrorCode, errorMessage } from '@/features/core/errors';
import { t } from '@/features/core/i18n';

type Props = {
  token: string;
  isAuthenticated: boolean;
  /** The signed-in user's `emailVerifiedAt`, read by the route so `auth` doesn't depend on `users`. Undefined while signed out or still loading. */
  verifiedAt: string | null | undefined;
};

export function VerifyEmailPage({ token, isAuthenticated, verifiedAt }: Props) {
  const verify = useMutation(
    queries.auth.emailVerifications.update.mutationOptions()
  );

  // React strict mode mounts effects twice; a second real request on the same token would 400.
  const fired = useRef(false);

  const fire = useEffectEvent(() => {
    if (fired.current) {
      return;
    }

    fired.current = true;
    verify.mutate({ body: { token } });
  });

  useEffect(() => {
    fire();
  }, []);

  const resend = useMutation(
    queries.profile.emailVerifications.store.mutationOptions({
      onSuccess: ({ data }) => toast.success(data.message),
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  const onwardTo = isAuthenticated ? '/' : '/login';

  const onwardLabel = isAuthenticated
    ? t('auth.verifyEmailPage.continueToApp')
    : t('auth.verifyEmailPage.continueToLogin');

  if (verify.isSuccess) {
    return (
      <AuthCard
        title={t('auth.verifyEmailPage.verifiedTitle')}
        description={verify.data.data.message}
      >
        <Link
          to={onwardTo}
          className={buttonVariants({ size: 'lg', className: 'w-full' })}
        >
          {onwardLabel}
        </Link>
      </AuthCard>
    );
  }

  if (
    verify.isError &&
    apiErrorCode(verify.error) === 'E_INVALID_VERIFICATION_TOKEN'
  ) {
    // A second click of the same link re-sends an already-consumed token: 400, but the profile
    // (if we're signed in as the person who just verified) shows it already succeeded.
    if (isAuthenticated && verifiedAt) {
      return (
        <AuthCard
          title={t('auth.verifyEmailPage.verifiedTitle')}
          description={t('auth.verifyEmailPage.alreadyVerified')}
        >
          <Link
            to={onwardTo}
            className={buttonVariants({ size: 'lg', className: 'w-full' })}
          >
            {onwardLabel}
          </Link>
        </AuthCard>
      );
    }

    return (
      <AuthCard
        title={t('auth.verifyEmailPage.invalidTitle')}
        description={errorMessage(verify.error)}
      >
        {isAuthenticated && (
          <PendingButton
            size="lg"
            className="w-full"
            pending={resend.isPending}
            onClick={() => {
              resend.mutate({});
            }}
          >
            {t('auth.verifyEmailPage.resend')}
          </PendingButton>
        )}
      </AuthCard>
    );
  }

  if (verify.isError) {
    return (
      <AuthCard
        title={t('auth.verifyEmailPage.failedTitle')}
        description={errorMessage(verify.error)}
      >
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            verify.mutate({ body: { token } });
          }}
        >
          {t('auth.verifyEmailPage.tryAgain')}
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('auth.verifyEmailPage.verifyingTitle')} description="">
      {null}
    </AuthCard>
  );
}
