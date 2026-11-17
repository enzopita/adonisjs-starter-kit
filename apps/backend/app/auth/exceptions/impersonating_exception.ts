import ApiException from '#core/exceptions/api_exception';

/** The session is an admin acting as the user */
export default class ImpersonatingException extends ApiException<'E_IMPERSONATING'> {
  static override status = 403;
  static override code = 'E_IMPERSONATING';
  static override message =
    'An impersonated session cannot change the user’s sessions or security settings';
}
