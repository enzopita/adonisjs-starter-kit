import ListSessions from '#auth/queries/list_sessions'
import type { HttpContext } from '@adonisjs/core/http'
import RevokeSessions from '#auth/actions/revoke_sessions'
import ImpersonatingException from '#auth/exceptions/impersonating_exception'
import SessionTransformer from '#auth/transformers/session_transformer'
import { sessionParamsValidator } from '#auth/validators/session'
import SessionNotFoundException from '#auth/exceptions/session_not_found_exception'

/**
 * @tags Sessions
 */
export default class SessionsController {
  /**
   * List the active sessions
   *
   * The signed-in user's sessions, most recently used first, with the device each was opened on.
   * `current` marks the session making the request. Sessions an admin opened to act as the user are
   * not listed.
   */
  async index({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const currentTokenId = String(user.currentAccessToken!.identifier)

    const rows = await new ListSessions().handle({ userId: user.id, currentTokenId })

    return serialize(SessionTransformer.transform(rows))
  }

  /**
   * Revoke a session
   *
   * Signs that session out. It can be the current one.
   *
   * @throws {ImpersonatingException} The session is an admin acting as the user
   * @throws {SessionNotFoundException} No active session of the user has this id
   */
  async destroy({ auth, i18n, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.currentAccessToken?.impersonatorId) throw new ImpersonatingException()

    const { params } = await request.validateUsing(sessionParamsValidator)

    const revoked = await new RevokeSessions().handle({ user, sessionId: params.id })

    if (!revoked) throw new SessionNotFoundException()

    return serialize({ message: i18n.t('auth.session_revoked') })
  }

  /**
   * Revoke every other session
   *
   * Signs the user out everywhere except the session making the request. `revoked` is how many
   * sessions were signed out.
   *
   * @throws {ImpersonatingException} The session is an admin acting as the user
   */
  async destroyAll({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.currentAccessToken?.impersonatorId) throw new ImpersonatingException()

    const keepTokenId = String(user.currentAccessToken!.identifier)
    const revoked = await new RevokeSessions().handle({ user, keepTokenId })

    return serialize({ revoked })
  }
}
