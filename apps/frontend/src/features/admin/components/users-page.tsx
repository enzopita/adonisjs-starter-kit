import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@monorepo/ui/components/table'
import { useSuspenseQuery } from '@tanstack/react-query'
import { SearchInput } from '@/features/admin/components/search-input'
import { UserActions, UserStatus, displayName } from '@/features/admin/components/user-actions'
import { adminUsersQuery } from '@/features/admin/queries'
import type { AdminSearch } from '@/features/admin/queries'
import { PageHeader } from '@/features/core/components/page-header'
import { Pagination } from '@/features/core/components/pagination'
import { t } from '@/features/core/i18n'
import { UserAvatar } from '@/features/users/components/user-avatar'

export function UsersPage({
  search,
  onSearchChange,
}: {
  search: AdminSearch
  onSearchChange: (search: AdminSearch) => void
}) {
  const { data: users } = useSuspenseQuery(adminUsersQuery(search))

  return (
    <>
      <PageHeader
        title={t('admin.usersPage.title')}
        description={t('admin.usersPage.description')}
      />

      <SearchInput
        key={search.search}
        label={t('admin.usersPage.search')}
        value={search.search}
        onApply={next => onSearchChange({ search: next })}
      />

      {users.data.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('admin.usersPage.empty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.usersPage.user')}</TableHead>
              <TableHead>{t('admin.usersPage.workspaces')}</TableHead>
              <TableHead>{t('admin.usersPage.status')}</TableHead>
              <TableHead>
                <span className="sr-only">{t('admin.usersPage.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.data.map(row => (
              <TableRow key={row.user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserAvatar user={row.user} className="size-7" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{displayName(row)}</span>
                      <span className="truncate text-muted-foreground">{row.user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{row.tenantCount}</TableCell>
                <TableCell>
                  <UserStatus row={row} />
                </TableCell>
                <TableCell>
                  <UserActions row={row} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Pagination
        metadata={users.metadata}
        onPageChange={page => onSearchChange({ ...search, page })}
      />
    </>
  )
}
