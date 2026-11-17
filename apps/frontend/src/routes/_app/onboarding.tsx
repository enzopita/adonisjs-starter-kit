import { createFileRoute, redirect } from '@tanstack/react-router';

import { OnboardingPage } from '@/features/tenancy/components/onboarding-page';
import { tenantsQuery } from '@/features/tenancy/workspace';

export const Route = createFileRoute('/_app/onboarding')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const tenants = await queryClient.query(tenantsQuery());

    if (tenants.data.length > 0) throw redirect({ to: '/' });
  },
  component: OnboardingPage,
});
