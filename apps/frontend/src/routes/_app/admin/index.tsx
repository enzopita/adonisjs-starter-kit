import { createFileRoute } from '@tanstack/react-router'
import { TenantsPage } from '@/features/admin/components/tenants-page'
import { adminSearchSchema, adminTenantsQuery } from '@/features/admin/queries'

export const Route = createFileRoute('/_app/admin/')({
  validateSearch: adminSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient, platformAdmin }, deps }) => {
    if (platformAdmin) await queryClient.query(adminTenantsQuery(deps))
  },
  component: TenantsRoute,
})

function TenantsRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return <TenantsPage search={search} onSearchChange={next => void navigate({ search: next })} />
}
