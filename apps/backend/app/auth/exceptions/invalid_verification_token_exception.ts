import ApiException from '#core/exceptions/api_exception';

/** The verification token is invalid, expired, or already used */
export default class InvalidVerificationTokenException extends ApiException<'E_INVALID_VERIFICATION_TOKEN'> {
  static override status = 400;
  static override code = 'E_INVALID_VERIFICATION_TOKEN';
  static override message =
    'This email verification link is unknown or has expired';
}
