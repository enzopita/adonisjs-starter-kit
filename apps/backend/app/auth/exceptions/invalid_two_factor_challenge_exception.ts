import ApiException from '#core/exceptions/api_exception';

/** The two-factor challenge is invalid or expired */
export default class InvalidTwoFactorChallengeException extends ApiException<'E_INVALID_TWO_FACTOR_CHALLENGE'> {
  static override status = 400;
  static override code = 'E_INVALID_TWO_FACTOR_CHALLENGE';
  static override message =
    'The two-factor challenge is invalid or has expired';
}
