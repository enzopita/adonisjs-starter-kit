import { buttonVariants } from '@monorepo/ui/components/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@monorepo/ui/components/table'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { TenantStatus } from '@/features/admin/components/tenants-page'
import { UserActions, UserStatus, displayName } from '@/features/admin/components/user-actions'
import { adminTenantQuery } from '@/features/admin/queries'
import { PageHeader } from '@/features/core/components/page-header'
import { t } from '@/features/core/i18n'
import { UserAvatar } from '@/features/users/components/user-avatar'

export function TenantPage({ tenantId }: { tenantId: string }) {
  const {
    data: {
      data: { tenant, members },
    },
  } = useSuspenseQuery(adminTenantQuery(tenantId))

  return (
    <>
      <Link
        to="/admin"
        className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-fit' })}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        {t('admin.tenantPage.back')}
      </Link>

      <PageHeader
        title={tenant.name}
        description={t('admin.tenantPage.description')}
        actions={<TenantStatus suspendedAt={tenant.suspendedAt} />}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin.tenantPage.member')}</TableHead>
            <TableHead>{t('admin.tenantPage.role')}</TableHead>
            <TableHead>{t('admin.tenantPage.status')}</TableHead>
            <TableHead>
              <span className="sr-only">{t('admin.tenantPage.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map(member => (
            <TableRow key={member.user.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserAvatar user={member.user} className="size-7" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{displayName(member)}</span>
                    <span className="truncate text-muted-foreground">{member.user.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {member.role ?? (
                  <span className="text-muted-foreground">{t('admin.tenantPage.noRole')}</span>
                )}
              </TableCell>
              <TableCell>
                <UserStatus row={member} />
              </TableCell>
              <TableCell>
                <UserActions row={member} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
