import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@monorepo/ui/components/dialog'
import { FieldGroup } from '@monorepo/ui/components/field'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PermissionPicker } from '@/features/access/components/permission-picker'
import type {
  AssignablePermission,
  Permission,
  PermissionGroup,
} from '@/features/access/permissions'
import { queries, tenantHeaders } from '@/features/core/api'
import { useAppForm, withFormErrors } from '@/features/core/form'
import { t } from '@/features/core/i18n'

type Role = { id: string; name: string; permissions: Permission[] }

export function RoleDialog({
  role,
  groups,
  tenantId,
  open,
  onOpenChange,
}: {
  role?: Role
  groups: readonly PermissionGroup[]
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createRole = useMutation(queries.access.roles.store.mutationOptions())
  const updateRole = useMutation(queries.access.roles.update.mutationOptions())

  const form = useAppForm({
    defaultValues: {
      name: role?.name ?? '',
      // SAFETY: a role's stored permissions are always assignable; platform.admin never comes from one.
      permissions: (role?.permissions ?? []) as AssignablePermission[],
    },
    onSubmit: async ({ value, formApi }) => {
      const saved = await withFormErrors(
        formApi,
        role
          ? updateRole.mutateAsync({
              params: { id: role.id },
              body: value,
              ...tenantHeaders(tenantId),
            })
          : createRole.mutateAsync({ body: value, ...tenantHeaders(tenantId) }),
      )

      if (!saved) return

      onOpenChange(false)
      toast.success(
        role
          ? t('access.roleDialog.updated', { name: value.name })
          : t('access.roleDialog.created', { name: value.name }),
      )
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('access.roleDialog.close')}>
        <DialogHeader>
          <DialogTitle>
            {role ? t('access.roleDialog.editTitle') : t('access.roleDialog.newTitle')}
          </DialogTitle>
          <DialogDescription>
            {role ? t('access.roleDialog.editDescription') : t('access.roleDialog.newDescription')}
          </DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form>
            <FieldGroup>
              <form.FormAlert />
              <form.AppField name="name">
                {field => (
                  <field.TextField
                    label={t('access.roleDialog.roleName')}
                    placeholder={t('access.roleDialog.roleNamePlaceholder')}
                    required
                    maxLength={255}
                  />
                )}
              </form.AppField>
              <form.AppField name="permissions">
                {field => (
                  <PermissionPicker
                    groups={groups}
                    value={new Set(field.state.value)}
                    onChange={next => field.handleChange([...next])}
                  />
                )}
              </form.AppField>
              <DialogFooter>
                <form.SubmitButton>
                  {role ? t('access.roleDialog.save') : t('access.roleDialog.createRole')}
                </form.SubmitButton>
              </DialogFooter>
            </FieldGroup>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  )
}
