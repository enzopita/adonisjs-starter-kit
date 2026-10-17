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
import { useMutation, useQuery, useSuspenseQueries } from '@tanstack/react-query'
import { HistoryIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { RequirePermission } from '@/features/access/components/require-permission'
import { RoleDialog } from '@/features/access/components/role-dialog'
import { can, permissionLabel, usePermissions } from '@/features/access/permissions'
import { membersQuery, permissionCatalogQuery, rolesQuery } from '@/features/access/queries'
import { AuditHistoryDialog } from '@/features/audit/components/audit-history-dialog'
import { queries, tenantHeaders } from '@/features/core/api'
import type { api } from '@/features/core/api'
import { ConfirmDialog } from '@/features/core/components/confirm-dialog'
import { PageHeader } from '@/features/core/components/page-header'
import { errorMessage } from '@/features/core/errors'
import { t } from '@/features/core/i18n'
import { useActiveTenant } from '@/features/tenancy/workspace'

type Role = Awaited<ReturnType<typeof api.access.roles.index>>['data'][number]

export function RolesPage() {
  return (
    <RequirePermission permission="roles.manage">
      <Roles />
    </RequirePermission>
  )
}

function Roles() {
  const { id: tenantId } = useActiveTenant()
  // Counting a role's members needs the member list, which only members managers may read.
  const canSeeMembers = can(usePermissions(), 'members.manage')

  const [{ data: roles }, { data: catalog }] = useSuspenseQueries({
    queries: [rolesQuery(tenantId), permissionCatalogQuery(tenantId)],
  })

  const { data: members } = useQuery({ ...membersQuery(tenantId), enabled: canSeeMembers })
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)
  const [viewingHistory, setViewingHistory] = useState<Role | null>(null)

  return (
    <>
      <PageHeader
        title={t('access.rolesPage.title')}
        description={t('access.rolesPage.description')}
        actions={
          <Button onClick={() => setCreating(true)}>
            <PlusIcon data-icon="inline-start" />
            {t('access.rolesPage.newRole')}
          </Button>
        }
      />

      <RolesTable
        roles={roles.data}
        members={members?.data.members ?? null}
        onHistory={setViewingHistory}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      {creating && (
        <RoleDialog
          groups={catalog.data.groups}
          tenantId={tenantId}
          open
          onOpenChange={setCreating}
        />
      )}

      {editing && (
        <RoleDialog
          key={editing.id}
          role={editing}
          groups={catalog.data.groups}
          tenantId={tenantId}
          open
          onOpenChange={open => !open && setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteRoleDialog
          key={deleting.id}
          role={deleting}
          tenantId={tenantId}
          open
          onOpenChange={open => !open && setDeleting(null)}
        />
      )}

      {viewingHistory && (
        <AuditHistoryDialog
          key={viewingHistory.id}
          subject={{ type: 'role', id: viewingHistory.id }}
          name={viewingHistory.name}
          tenantId={tenantId}
          permissionLabel={key => permissionLabel(key).label}
          open
          onOpenChange={open => !open && setViewingHistory(null)}
        />
      )}
    </>
  )
}

function RolesTable({
  roles,
  members,
  onHistory,
  onEdit,
  onDelete,
}: {
  roles: readonly Role[]
  members: { roleId: string | null }[] | null
  onHistory: (role: Role) => void
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}) {
  const memberCount = new Map<string, number>()

  for (const member of members ?? []) {
    if (member.roleId) memberCount.set(member.roleId, (memberCount.get(member.roleId) ?? 0) + 1)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('access.rolesPage.role')}</TableHead>
          <TableHead>{t('access.rolesPage.permissions')}</TableHead>
          <TableHead>{t('access.rolesPage.members')}</TableHead>
          <TableHead>
            <span className="sr-only">{t('access.rolesPage.actions')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map(role => (
          <TableRow key={role.id}>
            <TableCell>
              <span className="font-medium">{role.name}</span>
            </TableCell>
            <TableCell>
              {role.permissions.length > 0 ? (
                <ul className="flex flex-wrap gap-1">
                  {role.permissions.map(permission => (
                    <li key={permission}>
                      <Badge variant="secondary">{permissionLabel(permission).label}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground">{t('access.rolesPage.noPermissions')}</span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-muted-foreground">
                {members ? (memberCount.get(role.id) ?? 0) : '—'}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('access.rolesPage.roleHistory', { name: role.name })}
                  onClick={() => onHistory(role)}
                >
                  <HistoryIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('access.rolesPage.editRole', { name: role.name })}
                  onClick={() => onEdit(role)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('access.rolesPage.deleteRole', { name: role.name })}
                  onClick={() => onDelete(role)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function DeleteRoleDialog({
  role,
  tenantId,
  open,
  onOpenChange,
}: {
  role: Role
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const deleteRole = useMutation(
    queries.access.roles.destroy.mutationOptions({
      onSuccess: () => {
        onOpenChange(false)
        toast.success(t('access.rolesPage.deleted', { name: role.name }))
      },
      onError: error => toast.error(errorMessage(error)),
    }),
  )

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('access.rolesPage.deleteTitle', { name: role.name })}
      description={t('access.rolesPage.deleteDescription')}
      confirmLabel={t('access.rolesPage.deleteConfirm')}
      pending={deleteRole.isPending}
      onConfirm={() => deleteRole.mutate({ params: { id: role.id }, ...tenantHeaders(tenantId) })}
    />
  )
}
