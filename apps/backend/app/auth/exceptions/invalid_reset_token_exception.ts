import ApiException from '#core/exceptions/api_exception';

/** The reset token is invalid, expired, or already used */
export default class InvalidResetTokenException extends ApiException<'E_INVALID_RESET_TOKEN'> {
  static override status = 400;
  static override code = 'E_INVALID_RESET_TOKEN';
  static override message =
    'This password reset link is unknown or has expired';
}
