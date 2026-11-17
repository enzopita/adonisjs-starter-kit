/** A login answer's session, failing the test when the login asked for a second factor instead. */
export function sessionOf<Session extends object>(
  data: Session | { twoFactorRequired: true; challenge: string }
) {
  if ('challenge' in data) {
    throw new Error('expected a session, got a two-factor challenge');
  }

  return data;
}
