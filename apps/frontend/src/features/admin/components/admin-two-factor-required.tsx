import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@monorepo/ui/components/empty';
import { Link } from '@tanstack/react-router';
import { ShieldAlertIcon } from 'lucide-react';

import { t } from '@/features/core/i18n';

/** A platform admin without two-factor confirmed: every other admin route refuses them until then. */
export function AdminTwoFactorRequired() {
  return (
    <div className="rounded-xl border border-dashed">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlertIcon />
          </EmptyMedia>
          <EmptyTitle>
            <h1>{t('admin.twoFactorRequired.title')}</h1>
          </EmptyTitle>
          <EmptyDescription>
            {t('admin.twoFactorRequired.description')}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            to="/profile"
            hash="two-factor"
            className="underline underline-offset-4"
          >
            {t('admin.twoFactorRequired.link')}
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  );
}
