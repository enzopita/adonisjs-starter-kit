import { Checkbox } from '@monorepo/ui/components/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@monorepo/ui/components/field';
import { useId } from 'react';

import { permissionLabel } from '@/features/access/permissions';
import type {
  AssignablePermission,
  PermissionGroup,
} from '@/features/access/permissions';
import { t } from '@/features/core/i18n';

export function PermissionPicker({
  groups,
  value,
  onChange,
  disabled,
}: {
  groups: readonly PermissionGroup[];
  value: ReadonlySet<AssignablePermission>;
  onChange: (next: Set<AssignablePermission>) => void;
  disabled?: boolean;
}) {
  const scope = useId();

  const toggle = (permission: AssignablePermission, checked: boolean) => {
    const next = new Set(value);

    if (checked) next.add(permission);
    else next.delete(permission);

    onChange(next);
  };

  return (
    <FieldSet>
      <FieldLegend variant="label">
        {t('access.permissionPicker.legend')}
      </FieldLegend>
      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          // SAFETY: the catalog only ever lists assignable permissions, never platform.admin.
          const permissions = group.permissions as AssignablePermission[];

          return (
            <div key={group.key} className="flex flex-col gap-1.5">
              <p className="text-muted-foreground text-xs font-medium">
                {permissionLabel(group.key).label}
              </p>
              {permissions.map((permission) => {
                const { label, description } = permissionLabel(permission);
                const id = `${scope}-${permission}`;

                return (
                  <FieldLabel key={permission} htmlFor={id}>
                    <Field orientation="horizontal">
                      <Checkbox
                        id={id}
                        checked={value.has(permission)}
                        onCheckedChange={(checked) =>
                          toggle(permission, checked === true)
                        }
                        disabled={disabled}
                      />
                      <FieldContent>
                        <FieldTitle>{label}</FieldTitle>
                        {description && (
                          <FieldDescription>{description}</FieldDescription>
                        )}
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                );
              })}
            </div>
          );
        })}
      </div>
    </FieldSet>
  );
}
