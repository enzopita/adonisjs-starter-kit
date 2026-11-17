import ApiException from '#core/exceptions/api_exception';

/** No active session of the user has this id */
export default class SessionNotFoundException extends ApiException<'E_SESSION_NOT_FOUND'> {
  static override status = 404;
  static override code = 'E_SESSION_NOT_FOUND';
  static override message = 'This session does not exist';
}
