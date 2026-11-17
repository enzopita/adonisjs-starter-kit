import ApiException from '#core/exceptions/api_exception';

/** Two-factor authentication is already on */
export default class TwoFactorAlreadyEnabledException extends ApiException<'E_TWO_FACTOR_ALREADY_ENABLED'> {
  static override status = 409;
  static override code = 'E_TWO_FACTOR_ALREADY_ENABLED';
  static override message = 'Two-factor authentication is already enabled';
}
