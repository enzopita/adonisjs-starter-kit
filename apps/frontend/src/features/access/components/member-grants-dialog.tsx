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

type Member = { userId: string; name: string; permissions: Permission[] }

export function MemberGrantsDialog({
  member,
  groups,
  tenantId,
  open,
  onOpenChange,
}: {
  member: Member
  groups: readonly PermissionGroup[]
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateGrants = useMutation(queries.access.memberPermissions.update.mutationOptions())

  const form = useAppForm({
    // SAFETY: a member's direct grants are always assignable; platform.admin never comes from one.
    defaultValues: { permissions: member.permissions as AssignablePermission[] },
    onSubmit: async ({ value, formApi }) => {
      const updated = await withFormErrors(
        formApi,
        updateGrants.mutateAsync({
          params: { userId: member.userId },
          body: value,
          ...tenantHeaders(tenantId),
        }),
      )

      if (!updated) return

      onOpenChange(false)
      toast.success(t('access.memberGrantsDialog.permissionsUpdated', { name: member.name }))
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('access.memberGrantsDialog.close')}>
        <DialogHeader>
          <DialogTitle>{t('access.memberGrantsDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('access.memberGrantsDialog.description', { name: member.name })}
          </DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form>
            <FieldGroup>
              <form.FormAlert />
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
                <form.SubmitButton>{t('access.memberGrantsDialog.save')}</form.SubmitButton>
              </DialogFooter>
            </FieldGroup>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  )
}
