/*
|--------------------------------------------------------------------------
| Named throttles
|--------------------------------------------------------------------------
|
| One throttle per endpoint family, so adding a limit to a new route is a
| single `.use(someThrottle)` on its route. Numbers live only here.
|
*/

import type { HttpContext } from '@adonisjs/core/http';
import app from '@adonisjs/core/services/app';
import limiter from '@adonisjs/limiter/services/main';

/**
 * Off in development: the e2e suite and local testing sign up and sign in far more often than
 * any limit allows. The test suite and production enforce every throttle.
 */
function throttle(
  name: string,
  build: (ctx: HttpContext) => ReturnType<typeof limiter.allowRequests>
) {
  return limiter.define(name, (ctx: HttpContext) =>
    app.inDev ? limiter.noLimit() : build(ctx)
  );
}

// `limiter.define(name, ...)` already namespaces `usingKey` under `name`, so the key below only
// needs the part that varies.

/** Caps login attempts per IP regardless of outcome, to stop one IP spraying many emails. */
export const loginIpThrottle = throttle('login_ip', (ctx) => {
  return limiter.allowRequests(30).every('15 mins').usingKey(ctx.request.ip());
});

/** Every second-step attempt per IP, valid or not; failures also count per user, below. */
export const twoFactorLoginIpThrottle = throttle(
  'two_factor_login_ip',
  (ctx) => {
    return limiter
      .allowRequests(30)
      .every('15 mins')
      .usingKey(ctx.request.ip());
  }
);

/** The signed-in endpoints that check a code (and a password): confirm, disable, regenerate. */
export const twoFactorManageThrottle = throttle('two_factor_manage', (ctx) => {
  return limiter.allowRequests(10).every('15 mins').usingKey(ctx.auth.user!.id);
});

export const signupThrottle = throttle('signup', (ctx) => {
  return limiter.allowRequests(5).every('1 hour').usingKey(ctx.request.ip());
});

export const invitationsCreateThrottle = throttle(
  'invitations_create',
  (ctx) => {
    const userId = ctx.auth.user!.id;
    const tenantId = ctx.tenant!.id;

    return limiter
      .allowRequests(20)
      .every('1 hour')
      .usingKey(`${userId}_${tenantId}`);
  }
);

export const invitationAcceptThrottle = throttle('invitation_accept', (ctx) => {
  return limiter.allowRequests(10).every('15 mins').usingKey(ctx.auth.user!.id);
});

export const passwordForgotIpThrottle = throttle(
  'password_forgot_ip',
  (ctx) => {
    return limiter.allowRequests(20).every('1 hour').usingKey(ctx.request.ip());
  }
);

/**
 * Keyed by email+IP like login failures, so a stranger can't use up the owner's resets. Runs
 * before validation, hence the raw input.
 */
export const passwordForgotEmailThrottle = throttle(
  'password_forgot_email',
  (ctx) => {
    const email = String(ctx.request.input('email', '')).toLowerCase();

    return limiter
      .allowRequests(3)
      .every('1 hour')
      .usingKey(`${ctx.request.ip()}_${email}`);
  }
);

export const passwordResetThrottle = throttle('password_reset', (ctx) => {
  return limiter.allowRequests(10).every('15 mins').usingKey(ctx.request.ip());
});

export const emailVerifyThrottle = throttle('email_verify', (ctx) => {
  return limiter.allowRequests(10).every('15 mins').usingKey(ctx.request.ip());
});

export const emailVerificationResendThrottle = throttle(
  'email_verification_resend',
  (ctx) => {
    return limiter.allowRequests(5).every('1 hour').usingKey(ctx.auth.user!.id);
  }
);

/**
 * Runs a credential check under a budget of 5 failures per 15 minutes, then a 15 minute block.
 * The attempt is reserved with an atomic consume before the check runs, so concurrent requests
 * can't all read a counter that hasn't moved yet. A success deletes the key, so a correct answer
 * never uses up the budget and clears the failures before it.
 */
async function guardFailures<T>(key: string, check: () => Promise<T>) {
  if (app.inDev) return check();

  const failures = limiter.use({
    requests: 5,
    duration: '15 mins',
    blockDuration: '15 mins',
  });

  await failures.consume(key);

  const result = await check();

  await failures.delete(key);

  return result;
}

/**
 * Keyed by email+IP rather than email alone, so a stranger failing on purpose can't lock the
 * owner out of their account.
 */
export function penalizeLoginFailure<T>(
  email: string,
  ip: string,
  check: () => Promise<T>
) {
  return guardFailures(`login_failure_${ip}_${email}`, check);
}

/**
 * For the code of a login's second step. Keyed by the user alone: whoever gets here knows the
 * password, and keying by IP would let them rotate IPs through the million TOTP values. The cost
 * is that they can lock the owner out of signing in for a while.
 */
export function penalizeTwoFactorFailure<T>(
  userId: string,
  check: () => Promise<T>
) {
  return guardFailures(`two_factor_failure_${userId}`, check);
}
