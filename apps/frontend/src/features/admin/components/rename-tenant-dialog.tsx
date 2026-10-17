import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@monorepo/ui/components/dialog'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queries } from '@/features/core/api'
import { useAppForm, withFormErrors } from '@/features/core/form'
import { t } from '@/features/core/i18n'

export function RenameTenantDialog({
  tenant,
  open,
  onOpenChange,
}: {
  tenant: { id: string; name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const rename = useMutation(queries.admin.tenants.update.mutationOptions())

  const form = useAppForm({
    defaultValues: { name: tenant.name },
    onSubmit: async ({ value, formApi }) => {
      const saved = await withFormErrors(
        formApi,
        rename.mutateAsync({ params: { id: tenant.id }, body: value }),
      )

      if (!saved) return

      onOpenChange(false)
      toast.success(t('admin.renameTenantDialog.renamed', { name: saved.data.name }))
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('admin.renameTenantDialog.close')}>
        <DialogHeader>
          <DialogTitle>{t('admin.renameTenantDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.renameTenantDialog.description', { name: tenant.name })}
          </DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form className="flex flex-col gap-4">
            <form.FormAlert />
            <form.AppField name="name">
              {field => (
                <field.TextField
                  label={t('admin.renameTenantDialog.name')}
                  required
                  maxLength={255}
                />
              )}
            </form.AppField>
            <DialogFooter>
              <form.SubmitButton>{t('admin.renameTenantDialog.save')}</form.SubmitButton>
            </DialogFooter>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  )
}
