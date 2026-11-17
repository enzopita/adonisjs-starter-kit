import { UserTokenSchema } from '#database/schema';

export type UserTokenPurpose = UserToken['purpose'];

/** A single-use token mailed to a user: only its SHA-256 hash is stored. */
export default class UserToken extends UserTokenSchema {}
