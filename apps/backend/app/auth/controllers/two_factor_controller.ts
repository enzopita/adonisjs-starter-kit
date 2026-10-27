import type User from '#users/models/user'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import RevokeSessions from '#auth/actions/revoke_sessions'
import ConfirmTwoFactor from '#auth/actions/confirm_two_factor'
import DisableTwoFactor from '#auth/actions/disable_two_factor'
import RegenerateRecoveryCodes from '#auth/actions/regenerate_recovery_codes'
import StartTwoFactorEnrollment from '#auth/actions/start_two_factor_enrollment'
import { countRecoveryCodes, secondFactorOf } from '#auth/services/two_factor'
import ImpersonatingException from '#auth/exceptions/impersonating_exception'
import {
  confirmTwoFactorValidator,
  disableTwoFactorValidator,
  regenerateRecoveryCodesValidator,
} from '#auth/validators/two_factor'

/** An admin acting as the user never changes how the user signs in. */
function ownUser({ auth }: HttpContext): User {
  const user = auth.getUserOrFail()

  if (user.currentAccessToken?.impersonatorId) throw new ImpersonatingException()

  return user
}

/**
 * @tags Two-factor
 */
export default class TwoFactorController {
  /**
   * Show the two-factor authentication status
   *
   * `recoveryCodesLeft` counts the unused recovery codes, and is 0 while two-factor authentication
   * is off.
   */
  async show({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    return serialize({
      enabled: user.twoFactorConfirmedAt !== null,
      recoveryCodesLeft: user.twoFactorConfirmedAt
        ? await countRecoveryCodes(db.connection(), user.id)
        : 0,
    })
  }

  /**
   * Start two-factor enrollment
   *
   * Starts, or restarts, enrollment. Returns the secret to show as a QR code (`uri`) and for manual
   * entry (`secret`). Calling it again replaces the pending secret. Nothing changes about signing
   * in until `POST /account/two-factor/confirmation` confirms it with a code.
   *
   * @throws {ImpersonatingException} The session is an admin acting as the user
   * @throws {import('#auth/exceptions/two_factor_already_enabled_exception').default} Two-factor authentication is already on
   */
  async store(ctx: HttpContext) {
    const user = ownUser(ctx)

    return ctx.serialize(await new StartTwoFactorEnrollment().handle({ user }))
  }

  /**
   * Turn on two-factor authentication
   *
   * Confirms the pending secret with the password and a code from the authenticator app. Returns
   * the recovery codes, the only time they are shown. Signs the user out of every other session.
   *
   * @throws {import('#auth/exceptions/invalid_password_exception').default | import('#auth/exceptions/invalid_two_factor_code_exception').default} The password or the code is wrong
   * @throws {ImpersonatingException} The session is an admin acting as the user
   * @throws {import('#auth/exceptions/two_factor_already_enabled_exception').default | import('#auth/exceptions/two_factor_not_started_exception').default} Two-factor authentication is already on, or enrollment was not started
   * @throws {429} Too many attempts; retry after the Retry-After header
   */
  async confirm(ctx: HttpContext) {
    const user = ownUser(ctx)
    const { password, code } = await ctx.request.validateUsing(confirmTwoFactorValidator)

    const recoveryCodes = await new ConfirmTwoFactor().handle({ user, password, code })

    // Every session must have passed a second factor: only this one, which just did, stays.
    const keepTokenId = String(user.currentAccessToken!.identifier)
    await new RevokeSessions().handle({ user, keepTokenId })

    return ctx.serialize({ recoveryCodes })
  }

  /**
   * Turn off two-factor authentication
   *
   * Needs the password and either a code from the authenticator app or one recovery code. Deletes
   * the secret and every recovery code.
   *
   * @throws {import('#auth/exceptions/invalid_password_exception').default | import('#auth/exceptions/invalid_two_factor_code_exception').default} The password is wrong, or the code or recovery code is wrong
   * @throws {ImpersonatingException} The session is an admin acting as the user
   * @throws {import('#auth/exceptions/two_factor_not_enabled_exception').default} Two-factor authentication is off
   * @throws {429} Too many attempts; retry after the Retry-After header
   */
  async destroy(ctx: HttpContext) {
    const user = ownUser(ctx)
    const { password, ...factor } = await ctx.request.validateUsing(disableTwoFactorValidator)

    await new DisableTwoFactor().handle({ user, password, factor: secondFactorOf(factor) })

    return ctx.serialize({ message: ctx.i18n.t('auth.two_factor_disabled') })
  }

  /**
   * Regenerate the recovery codes
   *
   * Needs the password and a code from the authenticator app. Replaces every recovery code, used or
   * not, and returns the new ones, the only time they are shown.
   *
   * @throws {import('#auth/exceptions/invalid_password_exception').default | import('#auth/exceptions/invalid_two_factor_code_exception').default} The password or the code is wrong
   * @throws {ImpersonatingException} The session is an admin acting as the user
   * @throws {import('#auth/exceptions/two_factor_not_enabled_exception').default} Two-factor authentication is off
   * @throws {429} Too many attempts; retry after the Retry-After header
   */
  async regenerateRecoveryCodes(ctx: HttpContext) {
    const user = ownUser(ctx)
    const { password, code } = await ctx.request.validateUsing(regenerateRecoveryCodesValidator)

    const recoveryCodes = await new RegenerateRecoveryCodes().handle({ user, password, code })

    return ctx.serialize({ recoveryCodes })
  }
}
