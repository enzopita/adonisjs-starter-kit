import { Button } from '@monorepo/ui/components/button';
import { useNavigate } from '@tanstack/react-router';
import { VenetianMaskIcon } from 'lucide-react';

import { api } from '@/features/core/api';
import { displayName } from '@/features/core/display-name';
import { t } from '@/features/core/i18n';
import { session } from '@/features/core/session';

export function ImpersonationBanner({
  user,
}: {
  user: { email: string; fullName: string | null };
}) {
  const navigate = useNavigate();

  const stop = async () => {
    // Ends the impersonation token server-side; the admin's own session comes back either way.
    await api.profile.accessTokens.destroy({}).safe();
    session.stopImpersonating();
    await navigate({ to: '/admin/users' });
  };

  return (
    <output className="bg-primary text-primary-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 py-1.5 text-xs">
      <VenetianMaskIcon className="size-4" aria-hidden />
      <span>
        {t('admin.impersonationBanner.signedInAs', {
          name: displayName(user),
          email: user.email,
        })}
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          void stop();
        }}
      >
        {t('admin.impersonationBanner.stop')}
      </Button>
    </output>
  );
}
