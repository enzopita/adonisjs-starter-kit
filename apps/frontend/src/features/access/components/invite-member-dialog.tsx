import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@monorepo/ui/components/dialog';
import { Field, FieldLabel } from '@monorepo/ui/components/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@monorepo/ui/components/select';
import { useMutation } from '@tanstack/react-query';
import { useId } from 'react';
import { toast } from 'sonner';

import { NO_ROLE, roleItems, toRoleId } from '@/features/access/role-options';
import { queries, tenantHeaders } from '@/features/core/api';
import { useAppForm, withFormErrors } from '@/features/core/form';
import { t } from '@/features/core/i18n';

type Role = { id: string; name: string };

type Invitation = { email: string };

/** Invites someone by email; inviting an email that's already pending re-sends it instead of failing. */
export function InviteMemberDialog({
  invitations,
  roles,
  tenantId,
  open,
  onOpenChange,
}: {
  invitations: readonly Invitation[];
  roles: readonly Role[];
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const roleFieldId = useId();
  const sendInvitation = useMutation(
    queries.access.invitations.store.mutationOptions()
  );

  const form = useAppForm({
    defaultValues: { email: '', roleId: NO_ROLE },
    onSubmit: async ({ value, formApi }) => {
      const email = value.email.trim().toLowerCase();
      const alreadyInvited = invitations.some(
        (invitation) => invitation.email === email
      );

      const sent = await withFormErrors(
        formApi,
        sendInvitation.mutateAsync({
          body: { email, roleId: toRoleId(value.roleId) },
          ...tenantHeaders(tenantId),
        })
      );

      if (!sent) return;

      onOpenChange(false);
      toast.success(
        alreadyInvited
          ? t('access.inviteMemberDialog.resent', { email })
          : t('access.inviteMemberDialog.sent', { email })
      );
    },
  });

  const items = roleItems(roles);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('access.inviteMemberDialog.close')}>
        <DialogHeader>
          <DialogTitle>{t('access.inviteMemberDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('access.inviteMemberDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form className="flex flex-col gap-4">
            <form.FormAlert />
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  label={t('access.inviteMemberDialog.email')}
                  type="email"
                  autoComplete="email"
                  required
                />
              )}
            </form.AppField>
            <form.Field name="roleId">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={roleFieldId}>
                    {t('access.inviteMemberDialog.role')}
                  </FieldLabel>
                  <Select
                    items={items}
                    value={field.state.value}
                    onValueChange={(value) =>
                      value && field.handleChange(value)
                    }
                  >
                    <SelectTrigger id={roleFieldId}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
            <DialogFooter>
              <form.SubmitButton>
                {t('access.inviteMemberDialog.submit')}
              </form.SubmitButton>
            </DialogFooter>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
