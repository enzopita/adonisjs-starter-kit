import { buttonVariants } from '@monorepo/ui/components/button';
import { FieldGroup } from '@monorepo/ui/components/field';
import { useMutation } from '@tanstack/react-query';
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { queries } from '@/features/core/api';
import { AuthCard } from '@/features/core/components/auth-card';
import { apiErrorCode, errorMessage } from '@/features/core/errors';
import { useAppForm, withFormErrors } from '@/features/core/form';
import { t } from '@/features/core/i18n';
import { session } from '@/features/core/session';

const route = getRouteApi('/reset-password/$token');

export function ResetPasswordPage() {
  const { token } = route.useParams();
  const navigate = useNavigate();

  const resetPassword = useMutation(
    queries.auth.passwordResets.update.mutationOptions()
  );

  const form = useAppForm({
    defaultValues: { password: '', passwordConfirmation: '' },
    onSubmit: async ({ value, formApi }) => {
      const reset = await withFormErrors(
        formApi,
        resetPassword.mutateAsync({ body: { token, ...value } })
      );

      if (!reset) {
        return;
      }

      // The API revoked every session for this account, this browser's included.
      session.signOut();
      toast.success(reset.data.message);
      await navigate({ to: '/login' });
    },
  });

  const { error } = resetPassword;

  if (error && apiErrorCode(error) === 'E_INVALID_RESET_TOKEN') {
    return (
      <AuthCard
        title={t('auth.resetPasswordPage.invalidTitle')}
        description={errorMessage(error)}
      >
        <Link
          to="/forgot-password"
          className={buttonVariants({ size: 'lg', className: 'w-full' })}
        >
          {t('auth.resetPasswordPage.requestNewLink')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t('auth.resetPasswordPage.title')}
      description={t('auth.resetPasswordPage.description')}
    >
      <form.AppForm>
        <form.Form>
          <FieldGroup>
            <form.FormAlert />
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  label={t('auth.resetPasswordPage.password')}
                  type="password"
                  autoComplete="new-password"
                  description={t('auth.resetPasswordPage.passwordDescription')}
                  required
                />
              )}
            </form.AppField>
            <form.AppField name="passwordConfirmation">
              {(field) => (
                <field.TextField
                  label={t('auth.resetPasswordPage.confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  required
                />
              )}
            </form.AppField>
            <form.SubmitButton size="lg">
              {t('auth.resetPasswordPage.submit')}
            </form.SubmitButton>
          </FieldGroup>
        </form.Form>
      </form.AppForm>
    </AuthCard>
  );
}
