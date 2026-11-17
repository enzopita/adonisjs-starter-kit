import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@monorepo/ui/components/card';

import { t } from '@/features/core/i18n';
import { CreateWorkspaceForm } from '@/features/tenancy/components/create-workspace-form';

export function OnboardingPage() {
  return (
    <main className="flex flex-1 items-start justify-center p-4 md:items-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1>{t('tenancy.onboardingPage.title')}</h1>
          </CardTitle>
          <CardDescription>
            {t('tenancy.onboardingPage.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWorkspaceForm />
        </CardContent>
      </Card>
    </main>
  );
}
