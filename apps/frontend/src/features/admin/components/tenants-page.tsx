import { Badge } from '@monorepo/ui/components/badge'
import { Button } from '@monorepo/ui/components/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@monorepo/ui/components/table'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { RenameTenantDialog } from '@/features/admin/components/rename-tenant-dialog'
import { SearchInput } from '@/features/admin/components/search-input'
import { adminTenantsQuery } from '@/features/admin/queries'
import type { AdminSearch } from '@/features/admin/queries'
import { queries } from '@/features/core/api'
import type { api } from '@/features/core/api'
import { ConfirmDialog } from '@/features/core/components/confirm-dialog'
import { PageHeader } from '@/features/core/components/page-header'
import { Pagination } from '@/features/core/components/pagination'
import { PendingButton } from '@/features/core/components/pending-button'
import { errorMessage } from '@/features/core/errors'
import { locale, t } from '@/features/core/i18n'

type Tenant = Awaited<ReturnType<typeof api.admin.tenants.index>>['data'][number]

const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

export function TenantsPage({
  search,
  onSearchChange,
}: {
  search: AdminSearch
  onSearchChange: (search: AdminSearch) => void
}) {
  const { data: tenants } = useSuspenseQuery(adminTenantsQuery(search))
  const [renaming, setRenaming] = useState<Tenant | null>(null)
  const [suspending, setSuspending] = useState<Tenant | null>(null)

  return (
    <>
      <PageHeader
        title={t('admin.tenantsPage.title')}
        description={t('admin.tenantsPage.description')}
      />

      <SearchInput
        key={search.search}
        label={t('admin.tenantsPage.search')}
        value={search.search}
        onApply={next => onSearchChange({ search: next })}
      />

      {tenants.data.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('admin.tenantsPage.empty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.tenantsPage.workspace')}</TableHead>
              <TableHead>{t('admin.tenantsPage.members')}</TableHead>
              <TableHead>{t('admin.tenantsPage.created')}</TableHead>
              <TableHead>{t('admin.tenantsPage.status')}</TableHead>
              <TableHead>
                <span className="sr-only">{t('admin.tenantsPage.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.data.map(tenant => (
              <TableRow key={tenant.id}>
                <TableCell>
                  <Link
                    to="/admin/tenants/$tenantId"
                    params={{ tenantId: tenant.id }}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {tenant.name}
                  </Link>
                </TableCell>
                <TableCell>{tenant.memberCount}</TableCell>
                <TableCell>
                  {tenant.createdAt && dateFormat.format(new Date(tenant.createdAt))}
                </TableCell>
                <TableCell>
                  <TenantStatus suspendedAt={tenant.suspendedAt} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('admin.tenantsPage.renameFor', { name: tenant.name })}
                      onClick={() => setRenaming(tenant)}
                    >
                      <PencilIcon />
                    </Button>
                    {tenant.suspendedAt ? (
                      <ReactivateButton tenant={tenant} />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={t('admin.tenantsPage.suspendFor', { name: tenant.name })}
                        onClick={() => setSuspending(tenant)}
                      >
                        {t('admin.tenantsPage.suspend')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pagination
        metadata={tenants.metadata}
        onPageChange={page => onSearchChange({ ...search, page })}
      />

      {renaming && (
        <RenameTenantDialog
          key={renaming.id}
          tenant={renaming}
          open
          onOpenChange={open => !open && setRenaming(null)}
        />
      )}

      {suspending && (
        <SuspendTenantDialog
          key={suspending.id}
          tenant={suspending}
          open
          onOpenChange={open => !open && setSuspending(null)}
        />
      )}
    </>
  )
}

export function TenantStatus({ suspendedAt }: { suspendedAt: string | null }) {
  return suspendedAt ? (
    <Badge variant="destructive">{t('admin.tenantsPage.suspended')}</Badge>
  ) : (
    <Badge variant="outline">{t('admin.tenantsPage.active')}</Badge>
  )
}

/** Reactivating gives access back, which needs no second thought, unlike suspending. */
function ReactivateButton({ tenant }: { tenant: Tenant }) {
  const reactivate = useMutation(
    queries.admin.tenantSuspensions.destroy.mutationOptions({
      onSuccess: () => toast.success(t('admin.tenantsPage.reactivated', { name: tenant.name })),
      onError: error => toast.error(errorMessage(error)),
    }),
  )

  return (
    <PendingButton
      variant="outline"
      size="sm"
      pending={reactivate.isPending}
      aria-label={t('admin.tenantsPage.reactivateFor', { name: tenant.name })}
      onClick={() => reactivate.mutate({ params: { id: tenant.id } })}
    >
      {t('admin.tenantsPage.reactivate')}
    </PendingButton>
  )
}

function SuspendTenantDialog({
  tenant,
  open,
  onOpenChange,
}: {
  tenant: Tenant
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const suspend = useMutation(
    queries.admin.tenantSuspensions.store.mutationOptions({
      onSuccess: () => {
        onOpenChange(false)
        toast.success(t('admin.tenantsPage.suspendedToast', { name: tenant.name }))
      },
      onError: error => toast.error(errorMessage(error)),
    }),
  )

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('admin.tenantsPage.suspendTitle', { name: tenant.name })}
      description={t('admin.tenantsPage.suspendDescription')}
      confirmLabel={t('admin.tenantsPage.suspend')}
      pending={suspend.isPending}
      onConfirm={() => suspend.mutate({ params: { id: tenant.id } })}
    />
  )
}
