import { createFileRoute, redirect } from '@tanstack/react-router';

import { SignupPage } from '@/features/auth/components/signup-page';
import { validateRedirectSearch } from '@/features/core/redirect';
import { session } from '@/features/core/session';

export const Route = createFileRoute('/signup')({
  validateSearch: validateRedirectSearch,
  beforeLoad: ({ search }) => {
    if (session.isAuthenticated()) {
      throw redirect({ to: search.redirect ?? '/' });
    }
  },
  component: SignupPage,
});
