import type { ApiClient } from '@japa/api-client';

export const account = {
  fullName: null,
  password: 'password123',
  passwordConfirmation: 'password123',
};

/** Signs up through the API and returns the access token sign-up opens, the account's first session. */
export async function signUp(client: ApiClient, email: string) {
  const response = await client
    .visit('auth.new_account.store')
    .json({ ...account, email });
  const { token }: { token: string } = response.body().data;

  return token;
}

/** The access token's id, which a session row and its audit events carry: `oat_<base64url id>.<secret>`. */
export function sessionIdOf(token: string) {
  return Buffer.from(
    token.slice('oat_'.length).split('.')[0]!,
    'base64url'
  ).toString();
}
