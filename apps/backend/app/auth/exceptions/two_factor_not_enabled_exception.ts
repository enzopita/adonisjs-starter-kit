import ApiException from '#core/exceptions/api_exception';

/** Two-factor authentication is off */
export default class TwoFactorNotEnabledException extends ApiException<'E_TWO_FACTOR_NOT_ENABLED'> {
  static override status = 409;
  static override code = 'E_TWO_FACTOR_NOT_ENABLED';
  static override message = 'Two-factor authentication is not enabled';
}
