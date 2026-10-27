import User from '#users/models/user'
import db from '@adonisjs/lucid/services/db'
import { audit } from '#core/audit/main'
import type {} from '#auth/types/audit'
import { openSession } from '#auth/services/sessions'
import type { HttpContext } from '@adonisjs/core/http'
import { penalizeTwoFactorFailure } from '#start/limiter'
import UserTransformer from '#users/transformers/user_transformer'
import { twoFactorLoginValidator } from '#auth/validators/two_factor'
import AccountDisabledException from '#auth/exceptions/account_disabled_exception'
import InvalidTwoFactorCodeException from '#auth/exceptions/invalid_two_factor_code_exception'
import InvalidTwoFactorChallengeException from '#auth/exceptions/invalid_two_factor_challenge_exception'
import {
  countRecoveryCodes,
  readTwoFactorChallenge,
  secondFactorOf,
  verifySecondFactor,
} from '#auth/services/two_factor'

/**
 * @tags Auth
 */
export default class TwoFactorLoginsController {
  /**
   * Finish signing in with a two-factor code
   *
   * The second step of a login that answered with a `challenge`: send it with either a code from
   * the authenticator app or one recovery code. Returns the user and an access token. A recovery
   * code works once. When the challenge fails, sign in again with the password.
   *
   * Wrong codes for one user are limited to 5 per 15 minutes, then blocked for 15 minutes.
   *
   * @throws {InvalidTwoFactorChallengeException | InvalidTwoFactorCodeException} The challenge is invalid or expired, or the code or recovery code is wrong
   * @throws {AccountDisabledException} The account is disabled, or must reset its password through the emailed link
   * @throws {429} Too many attempts; retry after the Retry-After header
   */
  async store({ request, serialize }: HttpContext) {
    const input = await request.validateUsing(twoFactorLoginValidator)

    const userId = readTwoFactorChallenge(input.challenge)
    const user = userId ? await User.find(userId) : null

    // Also when two-factor was disabled since the challenge: the password alone signs in again.
    if (!user?.twoFactorConfirmedAt) throw new InvalidTwoFactorChallengeException()

    if (user.disabledAt) throw new AccountDisabledException()

    const factor = secondFactorOf(input)

    try {
      await penalizeTwoFactorFailure(user.id, async () => {
        if (!(await verifySecondFactor(db.connection(), user, factor))) {
          throw new InvalidTwoFactorCodeException()
        }
      })
    } catch (error) {
      if (error instanceof InvalidTwoFactorCodeException) {
        await audit.note('auth.two_factor_failed', {
          tenantId: null,
          subject: { type: 'user', id: user.id },
          data: { email: user.email },
        })
      }

      throw error
    }

    const token = await openSession({
      user,
      userAgent: request.header('user-agent'),
      ipAddress: request.ip(),
    })

    if (factor.type === 'recovery_code') {
      await audit.note('auth.recovery_code_used', {
        tenantId: null,
        subject: { type: 'user', id: user.id },
        actorId: user.id,
        sessionId: String(token.identifier),
        data: { email: user.email, remaining: await countRecoveryCodes(db.connection(), user.id) },
      })
    }

    await audit.note('auth.logged_in', {
      tenantId: null,
      subject: { type: 'user', id: user.id },
      actorId: user.id,
      sessionId: String(token.identifier),
      data: { email: user.email, factor: factor.type },
    })

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
