import { createFileRoute } from '@tanstack/react-router'
import { TenantPage } from '@/features/admin/components/tenant-page'
import { adminTenantQuery } from '@/features/admin/queries'

export const Route = createFileRoute('/_app/admin/tenants/$tenantId')({
  loader: async ({ context: { queryClient, platformAdmin }, params }) => {
    if (platformAdmin) await queryClient.query(adminTenantQuery(params.tenantId))
  },
  component: TenantRoute,
})

function TenantRoute() {
  const { tenantId } = Route.useParams()

  return <TenantPage tenantId={tenantId} />
}
