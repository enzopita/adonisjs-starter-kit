import { FieldGroup } from '@monorepo/ui/components/field';
import { useMutation } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import { TuyauError } from '@tuyau/core/client';
import { useState } from 'react';

import { queries } from '@/features/core/api';
import { AuthCard } from '@/features/core/components/auth-card';
import { apiErrorCode, errorMessage, formErrors } from '@/features/core/errors';
import { useAppForm, withFormErrors } from '@/features/core/form';
import { t } from '@/features/core/i18n';
import { session } from '@/features/core/session';

const route = getRouteApi('/login');

/** Signing in reruns the route guards, which send the user on to `?redirect=`. */
export function LoginPage() {
  const { redirect: redirectTo } = route.useSearch();
  const createToken = useMutation(
    queries.auth.accessTokens.store.mutationOptions()
  );
  const [challenge, setChallenge] = useState<string | null>(null);

  // The alert shows the server's message; this adds the way to a fresh link once the mailed one expired.
  const passwordResetRequired =
    createToken.error instanceof TuyauError &&
    apiErrorCode(createToken.error) === 'E_PASSWORD_RESET_REQUIRED';

  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value, formApi }) => {
      const created = await withFormErrors(
        formApi,
        createToken.mutateAsync({ body: value })
      );

      if (created && !created.data.twoFactorRequired)
        session.signIn(created.data.token);

      if (created && created.data.twoFactorRequired)
        setChallenge(created.data.challenge);
    },
  });

  if (challenge) {
    return (
      <TwoFactorStep
        challenge={challenge}
        onChallengeExpired={(message) => {
          setChallenge(null);
          form.setErrorMap({ onSubmit: { fields: {}, form: message } });
        }}
      />
    );
  }

  return (
    <AuthCard
      title={t('auth.loginPage.title')}
      description={t('auth.loginPage.description')}
      footer={
        <p className="text-muted-foreground text-xs">
          {t('auth.loginPage.noAccount')}{' '}
          <Link
            to="/signup"
            search={{ redirect: redirectTo }}
            className="text-foreground underline underline-offset-4"
          >
            {t('auth.loginPage.createOne')}
          </Link>
        </p>
      }
    >
      <form.AppForm>
        <form.Form>
          <FieldGroup>
            <form.FormAlert />
            {passwordResetRequired && (
              <Link
                to="/forgot-password"
                className="text-foreground text-sm underline underline-offset-4"
              >
                {t('auth.loginPage.requestResetLink')}
              </Link>
            )}
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  label={t('auth.loginPage.email')}
                  type="email"
                  autoComplete="email"
                  required
                />
              )}
            </form.AppField>
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  label={t('auth.loginPage.password')}
                  type="password"
                  autoComplete="current-password"
                  required
                />
              )}
            </form.AppField>
            <Link
              to="/forgot-password"
              className="text-muted-foreground self-end text-xs underline underline-offset-4"
            >
              {t('auth.loginPage.forgotPassword')}
            </Link>
            <form.SubmitButton size="lg">
              {t('auth.loginPage.submit')}
            </form.SubmitButton>
          </FieldGroup>
        </form.Form>
      </form.AppForm>
    </AuthCard>
  );
}

/**
 * The second step of a login that answered a challenge: a code from the app, or a recovery code.
 * A challenge the server no longer accepts sends the caller back to email and password.
 */
function TwoFactorStep({
  challenge,
  onChallengeExpired,
}: {
  challenge: string;
  onChallengeExpired: (message: string) => void;
}) {
  const verify = useMutation(
    queries.auth.twoFactorLogins.store.mutationOptions()
  );
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const form = useAppForm({
    defaultValues: { code: '', recoveryCode: '' },
    onSubmit: async ({ value, formApi }) => {
      const body = useRecoveryCode
        ? { challenge, recoveryCode: value.recoveryCode }
        : { challenge, code: value.code };

      try {
        const { data } = await verify.mutateAsync({ body });

        session.signIn(data.token);
      } catch (error) {
        if (!(error instanceof TuyauError)) throw error;

        if (apiErrorCode(error) === 'E_INVALID_TWO_FACTOR_CHALLENGE') {
          onChallengeExpired(errorMessage(error));

          return;
        }

        formApi.setErrorMap({ onSubmit: formErrors(error) });
      }
    },
  });

  return (
    <AuthCard
      title={t('auth.loginPage.twoFactorTitle')}
      description={t('auth.loginPage.twoFactorDescription')}
    >
      <form.AppForm>
        <form.Form>
          <FieldGroup>
            <form.FormAlert />
            {useRecoveryCode ? (
              <form.AppField name="recoveryCode">
                {(field) => (
                  <field.TextField
                    label={t('auth.loginPage.recoveryCode')}
                    autoComplete="off"
                    required
                  />
                )}
              </form.AppField>
            ) : (
              <form.AppField name="code">
                {(field) => (
                  <field.TextField
                    label={t('auth.loginPage.code')}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    required
                  />
                )}
              </form.AppField>
            )}
            <button
              type="button"
              onClick={() => setUseRecoveryCode((value) => !value)}
              className="text-muted-foreground self-end text-xs underline underline-offset-4"
            >
              {useRecoveryCode
                ? t('auth.loginPage.useCode')
                : t('auth.loginPage.useRecoveryCode')}
            </button>
            <form.SubmitButton size="lg">
              {t('auth.loginPage.twoFactorSubmit')}
            </form.SubmitButton>
          </FieldGroup>
        </form.Form>
      </form.AppForm>
    </AuthCard>
  );
}
