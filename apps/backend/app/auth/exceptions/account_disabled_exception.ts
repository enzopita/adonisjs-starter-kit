import ApiException from '#core/exceptions/api_exception';

/** The account is disabled */
export default class AccountDisabledException extends ApiException<'E_ACCOUNT_DISABLED'> {
  static override status = 403;
  static override code = 'E_ACCOUNT_DISABLED';
  static override message = 'This account is disabled';
}
