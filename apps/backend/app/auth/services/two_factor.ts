import crypto from 'node:crypto';

import encryption from '@adonisjs/core/services/encryption';
import type {
  QueryClientContract,
  TransactionClientContract,
} from '@adonisjs/lucid/types/database';
import * as OTPAuth from 'otpauth';

import TwoFactorRecoveryCode from '#auth/models/two_factor_recovery_code';
import env from '#start/env';
import type User from '#users/models/user';

/** What a user offers as their second factor: a code from their app, or one recovery code. */
export type SecondFactor =
  | { type: 'totp'; code: string }
  | { type: 'recovery_code'; code: string };

const SECRET_PURPOSE = 'two_factor_secret';
const RECOVERY_CODE_PURPOSE = 'two_factor_recovery_code';
const CHALLENGE_PURPOSE = 'two_factor_challenge';

const RECOVERY_CODE_COUNT = 10;

// No 0/o, 1/i/l: a code is read off paper and typed by hand.
const RECOVERY_CODE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

function totpOf(base32: string, label?: string) {
  return new OTPAuth.TOTP({
    issuer: env.get('APP_NAME'),
    label,
    secret: OTPAuth.Secret.fromBase32(base32),
  });
}

/** A fresh secret: encrypted for the users row, and in clear for the authenticator app. */
export function newTwoFactorSecret(email: string) {
  const secret = new OTPAuth.Secret({ size: 20 });

  return {
    encrypted: encryption.encrypt(secret.base32, { purpose: SECRET_PURPOSE }),
    base32: secret.base32,
    uri: totpOf(secret.base32, email).toString(),
  };
}

/**
 * Accepts a code of the user's secret (pending or confirmed: the caller decides which counts)
 * within one 30-second step of drift, and records its step. A step at or before the last one
 * accepted is refused, and the conditional update makes two concurrent uses of one code race
 * for a single row, so only one wins.
 */
async function acceptTotp(
  client: QueryClientContract,
  user: User,
  code: string
) {
  const base32 =
    user.twoFactorSecret === null
      ? null
      : encryption.decrypt<string>(user.twoFactorSecret, SECRET_PURPOSE);

  if (base32 === null) {
    return false;
  }

  const totp = totpOf(base32);
  const timestamp = Date.now();

  const delta = totp.validate({
    token: code.replaceAll(/\s/gu, ''),
    timestamp,
    window: 1,
  });

  if (delta === null) {
    return false;
  }

  const step = totp.counter({ timestamp }) + delta;

  const updated = await client
    .from('users')
    .where('id', user.id)
    .where((query) =>
      query
        .whereNull('two_factor_last_step')
        .orWhere('two_factor_last_step', '<', step)
    )
    .update({ two_factor_last_step: step });

  return Number(updated) === 1;
}

const recoveryCodeHash = (code: string) =>
  encryption.blindIndex(
    code.toLowerCase().replaceAll(/[^a-z0-9]/gu, ''),
    RECOVERY_CODE_PURPOSE
  );

function newRecoveryCode() {
  const chars = Array.from(
    { length: 10 },
    () =>
      RECOVERY_CODE_ALPHABET[crypto.randomInt(RECOVERY_CODE_ALPHABET.length)]
  ).join('');

  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

/** Replaces the user's recovery codes and returns the new ones, the only time they're in clear. */
export async function replaceRecoveryCodes(
  client: QueryClientContract,
  userId: string
) {
  await TwoFactorRecoveryCode.query({ client })
    .where('user_id', userId)
    .delete();

  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, newRecoveryCode);

  await TwoFactorRecoveryCode.createMany(
    codes.map((code) => ({ userId, codeHash: recoveryCodeHash(code) })),
    { client }
  );

  return codes;
}

/** Deletes the matching code, so two concurrent uses of it delete one row and only one wins. */
async function consumeRecoveryCode(
  client: QueryClientContract,
  userId: string,
  code: string
) {
  const deleted = await TwoFactorRecoveryCode.query({ client })
    .where('user_id', userId)
    .where('code_hash', recoveryCodeHash(code))
    .delete();

  return Number(deleted) === 1;
}

/** Turns two-factor off: the secret, its last step and every recovery code. `user` is locked. */
export async function clearTwoFactor(
  trx: TransactionClientContract,
  user: User
) {
  user.merge({
    twoFactorSecret: null,
    twoFactorConfirmedAt: null,
    twoFactorLastStep: null,
  });
  await user.useTransaction(trx).save();

  await TwoFactorRecoveryCode.query({ client: trx })
    .where('user_id', user.id)
    .delete();
}

export function verifySecondFactor(
  client: QueryClientContract,
  user: User,
  factor: SecondFactor
) {
  return factor.type === 'totp'
    ? acceptTotp(client, user, factor.code)
    : consumeRecoveryCode(client, user.id, factor.code);
}

export async function countRecoveryCodes(
  client: QueryClientContract,
  userId: string
) {
  const [row] = await client
    .query<{ total: string }>()
    .from('two_factor_recovery_codes')
    .where('user_id', userId)
    .count('* as total');

  return Number(row?.total ?? 0);
}

/**
 * Proves for five minutes that the password of `userId` was right, without being a session.
 * Encrypted and authenticated with APP_KEY, so the client can neither read nor forge it.
 */
export function issueTwoFactorChallenge(userId: string): string {
  return encryption.encrypt(
    { userId },
    { expiresIn: '5m', purpose: CHALLENGE_PURPOSE }
  );
}

/**
 * The user id a challenge was issued for, or null when it is forged or expired. Decryption
 * authenticates it, so a payload that decrypts is one `issueTwoFactorChallenge` wrote.
 */
export function readTwoFactorChallenge(challenge: string) {
  return (
    encryption.decrypt<{ userId: string }>(challenge, CHALLENGE_PURPOSE)
      ?.userId ?? null
  );
}

/** The validators require one of the two; `code` wins when both are sent. */
export function secondFactorOf(input: {
  code?: string;
  recoveryCode?: string;
}): SecondFactor {
  return input.code === undefined
    ? { type: 'recovery_code', code: input.recoveryCode ?? '' }
    : { type: 'totp', code: input.code };
}
