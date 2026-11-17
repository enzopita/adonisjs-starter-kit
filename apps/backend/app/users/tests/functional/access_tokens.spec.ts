import { test } from '@japa/runner';

function encode(value: string) {
  return Buffer.from(value).toString('base64url');
}

test.group('Users | access tokens', () => {
  test('rejects a token whose identifier is not a uuid', async ({ client }) => {
    const response = await client
      .get('/api/v1/account/profile')
      .bearerToken(`oat_${encode('1')}.${encode('secret')}`);

    response.assertStatus(401);
  });
});
