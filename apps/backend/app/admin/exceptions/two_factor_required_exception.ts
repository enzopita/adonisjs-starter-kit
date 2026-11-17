import ApiException from '#core/exceptions/api_exception';

/** The platform admin has not confirmed two-factor authentication */
export default class TwoFactorRequiredException extends ApiException<'E_TWO_FACTOR_REQUIRED'> {
  static override status = 403;
  static override code = 'E_TWO_FACTOR_REQUIRED';
  static override message =
    'Platform admins must enable two-factor authentication first';
}
