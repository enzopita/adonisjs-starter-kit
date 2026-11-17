import { createFileRoute, redirect } from '@tanstack/react-router';

import { LoginPage } from '@/features/auth/components/login-page';
import { validateRedirectSearch } from '@/features/core/redirect';
import { session } from '@/features/core/session';

export const Route = createFileRoute('/login')({
  validateSearch: validateRedirectSearch,
  beforeLoad: ({ search }) => {
    if (session.isAuthenticated())
      throw redirect({ to: search.redirect ?? '/' });
  },
  component: LoginPage,
});
