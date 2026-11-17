import { Exception } from '@adonisjs/core/exceptions';

export default class MissingTenantContextException extends Exception {
  static override status = 500;
  static override code = 'E_MISSING_TENANT_CONTEXT';
  static override message =
    'A tenant-scoped model was queried outside a tenant context: wrap the code in runInTenant() or runAsSystem()';
}
