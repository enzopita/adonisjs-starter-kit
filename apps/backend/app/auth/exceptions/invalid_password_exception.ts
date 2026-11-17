import ApiException from '#core/exceptions/api_exception';

/** The password is wrong */
export default class InvalidPasswordException extends ApiException<'E_INVALID_PASSWORD'> {
  static override status = 400;
  static override code = 'E_INVALID_PASSWORD';
  static override message = 'The password is wrong';
}
