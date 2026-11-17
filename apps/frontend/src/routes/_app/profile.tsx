import { createFileRoute } from '@tanstack/react-router';

import { AccountActivity } from '@/features/audit/components/account-activity';
import { SessionsCard } from '@/features/auth/components/sessions-card';
import { TwoFactorCard } from '@/features/auth/components/two-factor-card';
import { ProfilePage } from '@/features/users/components/profile-page';

export const Route = createFileRoute('/_app/profile')({
  component: ProfileRoute,
});

function ProfileRoute() {
  return (
    <ProfilePage>
      <TwoFactorCard />
      <SessionsCard />
      <AccountActivity />
    </ProfilePage>
  );
}
