import User from '#users/models/user'
import { audit } from '#core/audit/main'
import type {} from '#auth/types/audit'
import { penalizeLoginFailure } from '#start/limiter'
import { openSession } from '#auth/services/sessions'
import { errors as limiterErrors } from '@adonisjs/limiter'
import { issueTwoFactorChallenge } from '#auth/services/two_factor'
import AccountDisabledException from '#auth/exceptions/account_disabled_exception'
import PasswordResetRequiredException from '#auth/exceptions/password_reset_required_exception'

export interface LogInInput {
  email: string
  password: string
  userAgent: string | undefined
  ipAddress: string
}

/** The password was right, but the account needs a second factor before a session opens. */
async function challenge(user: User) {
  await audit.note('auth.two_factor_challenged', {
    tenantId: null,
    subject: { type: 'user', id: user.id },
    actorId: user.id,
    data: { email: user.email },
  })

  return { twoFactorRequired: true as const, challenge: issueTwoFactorChallenge(user.id) }
}

async function verifyCredentials(email: string, password: string, ipAddress: string) {
  try {
    return await penalizeLoginFailure(email, ipAddress, () => {
      return User.verifyCredentials(email, password)
    })
  } catch (error) {
    // A throttle rejection isn't a credential attempt: nothing to audit, just rethrow for the
    // exception handler to turn into a 429.
    if (error instanceof limiterErrors.E_TOO_MANY_REQUESTS) throw error

    const owner = await User.findBy('email', email)

    await audit.note('auth.login_failed', {
      tenantId: null,
      subject: owner ? { type: 'user', id: owner.id } : null,
      data: { email },
    })

    throw error
  }
}

/** Opens a session for the right password, or answers a two-factor challenge instead. */
export default class LogIn {
  async handle({ email, password, userAgent, ipAddress }: LogInInput) {
    const user = await verifyCredentials(email, password, ipAddress)

    // After the password check, so the answer doesn't tell whether an email is disabled.
    if (user.disabledAt) throw new AccountDisabledException()

    if (user.passwordResetRequiredAt) {
      await audit.note('auth.password_reset_required', {
        tenantId: null,
        subject: { type: 'user', id: user.id },
        data: { email: user.email },
      })

      throw new PasswordResetRequiredException()
    }

    if (user.twoFactorConfirmedAt) return challenge(user)

    const token = await openSession({ user, userAgent, ipAddress })

    // Enabling 2FA revokes every other session once it commits: a token created before that is
    // revoked, and one created after sees the confirmation here.
    if (user.twoFactorConfirmedAt !== null) {
      await User.accessTokens.delete(user, token.identifier)

      return challenge(user)
    }

    await audit.note('auth.logged_in', {
      tenantId: null,
      subject: { type: 'user', id: user.id },
      actorId: user.id,
      sessionId: String(token.identifier),
      data: { email: user.email },
    })

    return { twoFactorRequired: false as const, user, token }
  }
}
