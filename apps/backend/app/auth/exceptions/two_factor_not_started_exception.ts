import ApiException from '#core/exceptions/api_exception';

/** Two-factor enrollment was not started */
export default class TwoFactorNotStartedException extends ApiException<'E_TWO_FACTOR_NOT_STARTED'> {
  static override status = 409;
  static override code = 'E_TWO_FACTOR_NOT_STARTED';
  static override message = 'Two-factor enrollment has not been started';
}
