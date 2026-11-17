import { t } from '@/features/core/i18n';

/** No role is a real, selectable state, so it needs its own value distinct from an empty string. */
export const NO_ROLE = 'none';

export function roleItems(roles: readonly { id: string; name: string }[]) {
  return [
    { value: NO_ROLE, label: t('access.roleOptions.noRole') },
    ...roles.map((role) => ({ value: role.id, label: role.name })),
  ];
}

export const toRoleId = (value: string) => (value === NO_ROLE ? null : value);
