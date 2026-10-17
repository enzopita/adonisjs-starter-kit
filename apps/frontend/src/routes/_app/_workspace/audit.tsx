import { createFileRoute } from '@tanstack/react-router'
import { RequirePermission } from '@/features/access/components/require-permission'
import { can, permissionLabel } from '@/features/access/permissions'
import { myPermissionsQuery } from '@/features/access/queries'
import { AuditPage } from '@/features/audit/components/audit-page'
import { auditEventsQuery, auditSearchSchema } from '@/features/audit/queries'

export const Route = createFileRoute('/_app/_workspace/audit')({
  validateSearch: auditSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient, tenant }, deps }) => {
    const { permissions } = (await queryClient.query(myPermissionsQuery(tenant.id))).data

    if (!can(permissions, 'audit.view')) return

    await queryClient.query(auditEventsQuery(tenant.id, deps))
  },
  component: AuditRoute,
})

function AuditRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <RequirePermission permission="audit.view">
      <AuditPage
        search={search}
        onSearchChange={next => void navigate({ search: next })}
        permissionLabel={key => permissionLabel(key).label}
      />
    </RequirePermission>
  )
}
