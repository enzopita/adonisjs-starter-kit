import ApiException from '#core/exceptions/api_exception';

/** The user is disabled */
export default class UserDisabledException extends ApiException<'E_USER_DISABLED'> {
  static override status = 409;
  static override code = 'E_USER_DISABLED';
  static override message = 'Enable this account first';
}
