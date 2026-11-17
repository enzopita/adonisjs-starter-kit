import crypto from 'node:crypto';

/** A token for a mailed link: the raw value only ever goes in the link, the table stores its hash. */
export function newToken() {
  const raw = crypto.randomBytes(32).toString('hex');

  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
