import { FieldGroup } from '@monorepo/ui/components/field';
import { useMutation } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';

import { queries } from '@/features/core/api';
import { AuthCard } from '@/features/core/components/auth-card';
import { useAppForm, withFormErrors } from '@/features/core/form';
import { resolveLocale, t } from '@/features/core/i18n';
import { session } from '@/features/core/session';

const route = getRouteApi('/signup');

/** Signing up reruns the route guards, which send the user on to `?redirect=`. */
export function SignupPage() {
  const { redirect: redirectTo } = route.useSearch();
  const createAccount = useMutation(
    queries.auth.newAccount.store.mutationOptions()
  );

  const form = useAppForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      passwordConfirmation: '',
    },
    onSubmit: async ({ value, formApi }) => {
      const created = await withFormErrors(
        formApi,
        createAccount.mutateAsync({
          body: {
            ...value,
            fullName: value.fullName.trim() || null,
            // Fresh browser detection, not the persisted UI language: on a shared browser the
            // persisted value can be a previous account's choice, and a new signup must never
            // inherit it.
            locale: resolveLocale(navigator.languages),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        })
      );

      if (created) session.signIn(created.data.token);
    },
  });

  return (
    <AuthCard
      title={t('auth.signupPage.title')}
      description={t('auth.signupPage.description')}
      footer={
        <p className="text-muted-foreground text-xs">
          {t('auth.signupPage.haveAccount')}{' '}
          <Link
            to="/login"
            search={{ redirect: redirectTo }}
            className="text-foreground underline underline-offset-4"
          >
            {t('auth.signupPage.signIn')}
          </Link>
        </p>
      }
    >
      <form.AppForm>
        <form.Form>
          <FieldGroup>
            <form.FormAlert />
            <form.AppField name="fullName">
              {(field) => (
                <field.TextField
                  label={t('auth.signupPage.fullName')}
                  autoComplete="name"
                />
              )}
            </form.AppField>
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  label={t('auth.signupPage.email')}
                  type="email"
                  autoComplete="email"
                  required
                />
              )}
            </form.AppField>
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  label={t('auth.signupPage.password')}
                  type="password"
                  autoComplete="new-password"
                  description={t('auth.signupPage.passwordDescription')}
                  required
                />
              )}
            </form.AppField>
            <form.AppField name="passwordConfirmation">
              {(field) => (
                <field.TextField
                  label={t('auth.signupPage.confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  required
                />
              )}
            </form.AppField>
            <form.SubmitButton size="lg">
              {t('auth.signupPage.submit')}
            </form.SubmitButton>
          </FieldGroup>
        </form.Form>
      </form.AppForm>
    </AuthCard>
  );
}
