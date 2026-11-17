import ApiException from '#core/exceptions/api_exception';

/** The tenant is suspended */
export default class TenantSuspendedException extends ApiException<'E_TENANT_SUSPENDED'> {
  static override status = 403;
  static override code = 'E_TENANT_SUSPENDED';
  static override message = 'The tenant is suspended';
}
