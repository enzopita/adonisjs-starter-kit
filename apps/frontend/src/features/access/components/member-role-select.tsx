import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@monorepo/ui/components/select';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { NO_ROLE, roleItems, toRoleId } from '@/features/access/role-options';
import { queries, tenantHeaders } from '@/features/core/api';
import { errorMessage } from '@/features/core/errors';
import { t } from '@/features/core/i18n';

type Role = { id: string; name: string };

/**
 * Bound to the server's `roleId`, not local state: a failed change leaves it showing the role
 * the member still has, with no separate revert step.
 */
export function MemberRoleSelect({
  userId,
  name,
  roleId,
  roles,
  tenantId,
}: {
  userId: string;
  name: string;
  roleId: string | null;
  roles: readonly Role[];
  tenantId: string;
}) {
  const updateRole = useMutation(
    queries.access.memberRoles.update.mutationOptions({
      onSuccess: () =>
        toast.success(t('access.memberRoleSelect.roleUpdated', { name })),
      onError: (error) => toast.error(errorMessage(error)),
    })
  );

  const onValueChange = (value: string | null) => {
    if (value === null) return;

    updateRole.mutate({
      params: { userId },
      body: { roleId: toRoleId(value) },
      ...tenantHeaders(tenantId),
    });
  };

  const items = roleItems(roles);

  return (
    <Select
      items={items}
      value={roleId ?? NO_ROLE}
      onValueChange={onValueChange}
      disabled={updateRole.isPending}
    >
      <SelectTrigger
        aria-label={t('access.memberRoleSelect.roleFor', { name })}
      >
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
  );
}
