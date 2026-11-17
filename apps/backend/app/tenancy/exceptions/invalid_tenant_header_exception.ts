import ApiException from '#core/exceptions/api_exception';

/** The X-Tenant-Id header is missing or not a UUID */
export default class InvalidTenantHeaderException extends ApiException<'E_INVALID_TENANT_HEADER'> {
  static override status = 400;
  static override code = 'E_INVALID_TENANT_HEADER';
  static override message = 'The X-Tenant-Id header is missing or not a UUID';
}
