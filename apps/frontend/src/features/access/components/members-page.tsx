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
import { useSuspenseQueries } from '@tanstack/react-query'
import { HistoryIcon, KeyRoundIcon } from 'lucide-react'
import { useState } from 'react'
import { MemberGrantsDialog } from '@/features/access/components/member-grants-dialog'
import { MemberRoleSelect } from '@/features/access/components/member-role-select'
import { RequirePermission } from '@/features/access/components/require-permission'
import { permissionLabel } from '@/features/access/permissions'
import { membersQuery, permissionCatalogQuery, rolesQuery } from '@/features/access/queries'
import { AuditHistoryDialog } from '@/features/audit/components/audit-history-dialog'
import type { api } from '@/features/core/api'
import { PageHeader } from '@/features/core/components/page-header'
import { t } from '@/features/core/i18n'
import { useActiveTenant } from '@/features/tenancy/workspace'
import { UserAvatar } from '@/features/users/components/user-avatar'
import { profileQuery } from '@/features/users/profile'

type Member = Awaited<ReturnType<typeof api.access.members.index>>['data']['members'][number]

export function MembersPage() {
  return (
    <RequirePermission permission="members.manage">
      <Members />
    </RequirePermission>
  )
}

function Members() {
  const { id: tenantId } = useActiveTenant()

  const [{ data: members }, { data: roles }, { data: catalog }, { data: user }] =
    useSuspenseQueries({
      queries: [
        membersQuery(tenantId),
        rolesQuery(tenantId),
        permissionCatalogQuery(tenantId),
        profileQuery(),
      ],
    })

  const [editing, setEditing] = useState<Member | null>(null)
  const [viewingHistory, setViewingHistory] = useState<Member | null>(null)

  return (
    <>
      <PageHeader
        title={t('access.membersPage.title')}
        description={t('access.membersPage.description')}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('access.membersPage.member')}</TableHead>
            <TableHead>{t('access.membersPage.role')}</TableHead>
            <TableHead>{t('access.membersPage.extraPermissions')}</TableHead>
            <TableHead>
              <span className="sr-only">{t('access.membersPage.actions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.data.members.map(member => {
            const name = member.user.fullName ?? member.user.email

            return (
              <TableRow key={member.user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserAvatar user={member.user} alt="" className="size-7" />
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-1.5 truncate font-medium">
                        {name}
                        {member.user.id === user.data.id && (
                          <Badge variant="outline">{t('access.membersPage.you')}</Badge>
                        )}
                      </span>
                      <span className="truncate text-muted-foreground">{member.user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <MemberRoleSelect
                    userId={member.user.id}
                    name={name}
                    roleId={member.roleId}
                    roles={roles.data}
                    tenantId={tenantId}
                  />
                </TableCell>
                <TableCell>
                  {member.permissions.length > 0 ? (
                    <ul className="flex flex-wrap gap-1">
                      {member.permissions.map(permission => (
                        <li key={permission}>
                          <Badge variant="secondary">{permissionLabel(permission).label}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground">{t('access.membersPage.none')}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('access.membersPage.historyFor', { name })}
                      onClick={() => setViewingHistory(member)}
                    >
                      <HistoryIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('access.membersPage.editPermissionsFor', { name })}
                      onClick={() => setEditing(member)}
                    >
                      <KeyRoundIcon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {editing && (
        <MemberGrantsDialog
          key={editing.user.id}
          member={{
            userId: editing.user.id,
            name: editing.user.fullName ?? editing.user.email,
            permissions: editing.permissions,
          }}
          groups={catalog.data.groups}
          tenantId={tenantId}
          open
          onOpenChange={open => !open && setEditing(null)}
        />
      )}

      {viewingHistory && (
        <AuditHistoryDialog
          key={viewingHistory.user.id}
          subject={{ type: 'member', id: viewingHistory.user.id }}
          name={viewingHistory.user.fullName ?? viewingHistory.user.email}
          tenantId={tenantId}
          permissionLabel={key => permissionLabel(key).label}
          open
          onOpenChange={open => !open && setViewingHistory(null)}
        />
      )}
    </>
  )
}
