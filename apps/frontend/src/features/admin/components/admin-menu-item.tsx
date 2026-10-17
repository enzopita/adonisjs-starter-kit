import { DropdownMenuItem } from '@monorepo/ui/components/dropdown-menu'
import { Link } from '@tanstack/react-router'
import { ShieldCheckIcon } from 'lucide-react'
import { t } from '@/features/core/i18n'

export function AdminMenuItem() {
  return (
    <DropdownMenuItem render={<Link to="/admin" />}>
      <ShieldCheckIcon />
      {t('admin.menu.admin')}
    </DropdownMenuItem>
  )
}
