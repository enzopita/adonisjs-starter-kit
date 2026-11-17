import ApiException from '#core/exceptions/api_exception';

/** The change would leave no one able to manage members */
export default class LastManagerException extends ApiException<'E_LAST_MANAGER'> {
  static override status = 409;
  static override code = 'E_LAST_MANAGER';
  static override message =
    'This change would leave no one able to manage members';
}
