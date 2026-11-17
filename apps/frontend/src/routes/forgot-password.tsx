import { createFileRoute, redirect } from '@tanstack/react-router';

import { ForgotPasswordPage } from '@/features/auth/components/forgot-password-page';
import { session } from '@/features/core/session';

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: () => {
    if (session.isAuthenticated()) {
      throw redirect({ to: '/' });
    }
  },
  component: ForgotPasswordPage,
});
