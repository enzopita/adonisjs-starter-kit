import { test } from '@japa/runner';

import User from '#users/models/user';

// Regression: a user without a name shows the first letter of their email's domain.
test.group('Users | initials', () => {
  test('{fullName} {email} reads {initials}')
    .with([
      { fullName: null, email: 'ada@example.com', initials: 'AD' },
      { fullName: 'Ada Lovelace', email: 'ada@example.com', initials: 'AL' },
      { fullName: 'Ada', email: 'countess@example.com', initials: 'AD' },
    ])
    .run(({ assert }, { fullName, email, initials }) => {
      assert.equal(new User().merge({ fullName, email }).initials, initials);
    });
});
