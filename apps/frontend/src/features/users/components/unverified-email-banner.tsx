import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { queries } from '@/features/core/api';
import { PendingButton } from '@/features/core/components/pending-button';
import { errorMessage } from '@/features/core/errors';
import { t } from '@/features/core/i18n';

/** Shown in `_app`'s layout while `emailVerifiedAt` is null; a successful verify invalidates every query, so it drops on its own. */
export function UnverifiedEmailBanner({ email }: { email: string }) {
  const resend = useMutation(
    queries.profile.emailVerifications.store.mutationOptions({
      onSuccess: ({ data }) => toast.success(data.message),
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  return (
    <div
      role="status"
      className="bg-primary text-primary-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 py-1.5 text-xs"
    >
      <span>{t('users.unverifiedEmailBanner.message', { email })}</span>
      <PendingButton
        variant="secondary"
        size="sm"
        pending={resend.isPending}
        onClick={() => resend.mutate({})}
      >
        {t('users.unverifiedEmailBanner.resend')}
      </PendingButton>
    </div>
  );
}
