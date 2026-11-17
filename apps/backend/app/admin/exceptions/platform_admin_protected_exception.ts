import ApiException from '#core/exceptions/api_exception';

/** The user is a platform admin */
export default class PlatformAdminProtectedException extends ApiException<'E_PLATFORM_ADMIN_PROTECTED'> {
  static override status = 409;
  static override code = 'E_PLATFORM_ADMIN_PROTECTED';
  static override message =
    'Platform admins can’t be disabled, impersonated or have their two-factor reset';
}
