import { createFileRoute, redirect } from '@tanstack/react-router'
import { SuspendedWorkspacePage } from '@/features/tenancy/components/suspended-workspace-page'
import { resolveTabWorkspace, tenantsQuery } from '@/features/tenancy/workspace'

/** Where the workspace layout sends a member whose active workspace is suspended. */
export const Route = createFileRoute('/_app/workspace-suspended')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const tenants = await queryClient.query(tenantsQuery())
    const tenant = resolveTabWorkspace(tenants.data)

    if (!tenant?.suspendedAt) throw redirect({ to: '/' })

    return { tenant }
  },
  component: SuspendedWorkspaceRoute,
})

function SuspendedWorkspaceRoute() {
  const { tenant } = Route.useRouteContext()

  return <SuspendedWorkspacePage name={tenant.name} />
}
