import ApiException from '#core/exceptions/api_exception';

/** The account must reset its password through the emailed link */
export default class PasswordResetRequiredException extends ApiException<'E_PASSWORD_RESET_REQUIRED'> {
  static override status = 403;
  static override code = 'E_PASSWORD_RESET_REQUIRED';
  static override message =
    'Choose a new password through the emailed link before signing in';
}
