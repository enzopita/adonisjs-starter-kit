import { Badge } from '@monorepo/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@monorepo/ui/components/card';
import { Link } from '@tanstack/react-router';

import { reachableNav } from '@/features/access/nav';
import { permissionLabel, usePermissions } from '@/features/access/permissions';
import { PageHeader } from '@/features/core/components/page-header';
import { t } from '@/features/core/i18n';
import { useActiveTenant } from '@/features/tenancy/workspace';

export function OverviewPage() {
  const tenant = useActiveTenant();
  const permissions = usePermissions();
  const sections = reachableNav(permissions).filter((item) => item.to !== '/');

  return (
    <>
      <PageHeader
        title={tenant.name}
        description={t('access.overviewPage.description')}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t('access.overviewPage.yourPermissions')}</h2>
          </CardTitle>
          <CardDescription>
            {permissions.length > 0
              ? t('access.overviewPage.withPermissions')
              : t('access.overviewPage.withoutPermissions')}
          </CardDescription>
        </CardHeader>
        {permissions.length > 0 && (
          <CardContent>
            <ul
              aria-label={t('access.overviewPage.yourPermissions')}
              className="flex flex-wrap gap-2"
            >
              {permissions.map((permission) => (
                <li key={permission}>
                  <Badge variant="secondary">
                    {permissionLabel(permission).label}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      {sections.length > 0 && (
        <section
          aria-labelledby="sections-heading"
          className="flex flex-col gap-3"
        >
          <h2 id="sections-heading" className="text-sm font-medium">
            {t('access.overviewPage.manage')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="focus-visible:ring-ring rounded-xl transition-shadow outline-none hover:shadow-md focus-visible:ring-2"
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>
                      <span className="flex items-center gap-2">
                        <item.icon className="text-muted-foreground size-4" />
                        {item.label}
                      </span>
                    </CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
