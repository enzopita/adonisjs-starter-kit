import { createFileRoute } from '@tanstack/react-router';

import { ResetPasswordPage } from '@/features/auth/components/reset-password-page';

// A signed-in visitor may still open this link: it still works, and signs them out everywhere.
export const Route = createFileRoute('/reset-password/$token')({
  component: ResetPasswordPage,
});
