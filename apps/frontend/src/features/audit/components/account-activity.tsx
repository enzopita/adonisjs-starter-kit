import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@monorepo/ui/components/card';

import { PagedAuditTrail } from '@/features/audit/components/paged-audit-trail';
import { accountActivityQuery } from '@/features/audit/queries';
import { t } from '@/features/core/i18n';

export function AccountActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('audit.accountActivity.title')}</h2>
        </CardTitle>
        <CardDescription>
          {t('audit.accountActivity.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PagedAuditTrail
          query={accountActivityQuery}
          empty={t('audit.accountActivity.empty')}
          showSession
        />
      </CardContent>
    </Card>
  );
}
