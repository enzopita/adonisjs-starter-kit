import type { Permission } from '#access/permissions'
import { AuthorizationResponse } from '@adonisjs/bouncer'

/**
 * A refusal of `can`, naming the permission and the tenant it was checked in, so the bouncer
 * middleware can audit the `authorize()` that throws it. `allows()` just reads it as false.
 */
export class PermissionDenial extends AuthorizationResponse {
  constructor(
    readonly permission: Permission,
    readonly tenantId: string | null,
  ) {
    super(false)
  }
}
