import { createFileRoute } from '@tanstack/react-router'
import { UsersPage } from '@/features/admin/components/users-page'
import { adminSearchSchema, adminUsersQuery } from '@/features/admin/queries'

export const Route = createFileRoute('/_app/admin/users')({
  validateSearch: adminSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient, platformAdmin }, deps }) => {
    if (platformAdmin) await queryClient.query(adminUsersQuery(deps))
  },
  component: UsersRoute,
})

function UsersRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return <UsersPage search={search} onSearchChange={next => void navigate({ search: next })} />
}
