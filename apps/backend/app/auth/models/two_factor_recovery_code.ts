import { TwoFactorRecoveryCodeSchema } from '#database/schema';

/** A single-use recovery code: only its keyed hash is stored, and using it deletes the row. */
export default class TwoFactorRecoveryCode extends TwoFactorRecoveryCodeSchema {}
