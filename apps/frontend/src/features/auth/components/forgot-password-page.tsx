import { FieldGroup } from '@monorepo/ui/components/field';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { queries } from '@/features/core/api';
import { AuthCard } from '@/features/core/components/auth-card';
import { useAppForm, withFormErrors } from '@/features/core/form';
import { t } from '@/features/core/i18n';

/**
 * The server answers the same message whether or not the email exists, so the form itself must
 * never branch on the result either: success just replaces the form with that message.
 */
export function ForgotPasswordPage() {
  const requestReset = useMutation(
    queries.auth.passwordResets.store.mutationOptions()
  );

  const form = useAppForm({
    defaultValues: { email: '' },
    onSubmit: async ({ value, formApi }) => {
      await withFormErrors(formApi, requestReset.mutateAsync({ body: value }));
    },
  });

  if (requestReset.isSuccess) {
    return (
      <AuthCard
        title={t('auth.forgotPasswordPage.title')}
        description={requestReset.data.data.message}
      >
        <Link
          to="/login"
          className="text-foreground text-sm underline underline-offset-4"
        >
          {t('auth.forgotPasswordPage.backToLogin')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t('auth.forgotPasswordPage.title')}
      description={t('auth.forgotPasswordPage.description')}
    >
      <form.AppForm>
        <form.Form>
          <FieldGroup>
            <form.FormAlert />
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  label={t('auth.forgotPasswordPage.email')}
                  type="email"
                  autoComplete="email"
                  required
                />
              )}
            </form.AppField>
            <form.SubmitButton size="lg">
              {t('auth.forgotPasswordPage.submit')}
            </form.SubmitButton>
          </FieldGroup>
        </form.Form>
      </form.AppForm>
    </AuthCard>
  );
}
