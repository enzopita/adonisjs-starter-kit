import { FieldGroup } from '@monorepo/ui/components/field';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { queries } from '@/features/core/api';
import { useAppForm, withFormErrors } from '@/features/core/form';
import { t } from '@/features/core/i18n';
import { selectWorkspace } from '@/features/tenancy/workspace';

export function CreateWorkspaceForm({ onCreated }: { onCreated?: () => void }) {
  const navigate = useNavigate();
  const createTenant = useMutation(
    queries.tenants.tenants.store.mutationOptions()
  );

  const form = useAppForm({
    defaultValues: { name: '' },
    onSubmit: async ({ value, formApi }) => {
      const created = await withFormErrors(
        formApi,
        createTenant.mutateAsync({ body: value })
      );

      if (!created) return;

      selectWorkspace(created.data.id);
      onCreated?.();
      await navigate({ to: '/' });
      toast.success(
        t('tenancy.createWorkspaceForm.created', { name: created.data.name })
      );
    },
  });

  return (
    <form.AppForm>
      <form.Form>
        <FieldGroup>
          <form.FormAlert />
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                label={t('tenancy.createWorkspaceForm.name')}
                placeholder={t('tenancy.createWorkspaceForm.namePlaceholder')}
                autoComplete="organization"
                required
                maxLength={255}
              />
            )}
          </form.AppField>
          <form.SubmitButton>
            {t('tenancy.createWorkspaceForm.submit')}
          </form.SubmitButton>
        </FieldGroup>
      </form.Form>
    </form.AppForm>
  );
}
