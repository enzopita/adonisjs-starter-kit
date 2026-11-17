import { AuthorizationResponse } from '@adonisjs/bouncer';

import type { Permission } from '#access/permissions';

/**
 * A refusal of `can`, naming the permission and the tenant it was checked in, so the bouncer
 * middleware can audit the `authorize()` that throws it. `allows()` just reads it as false.
 */
export class PermissionDenial extends AuthorizationResponse {
  readonly permission: Permission;
  readonly tenantId: string | null;

  constructor(permission: Permission, tenantId: string | null) {
    super(false);
    this.permission = permission;
    this.tenantId = tenantId;
  }
}
