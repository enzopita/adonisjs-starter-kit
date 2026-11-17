import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

import { login, signInAs, signUp } from './support/api.ts';

test('a member sees every signed-in device and signs them out from the profile page', async ({
  app,
  screen,
  browser,
}) => {
  const user = await signUp();
  await login(user);
  await login(user);

  await signInAs(browser, user);
  await app.open('/profile');

  const rows = () =>
    screen.getByRole('listitem').filter({ hasText: 'Last active' });

  await expect(rows()).toHaveCount(3);
  await expect(rows().filter({ hasText: 'This device' })).toHaveCount(1);

  // Only a non-current row offers "Sign out"; the current device's own row has none.
  await screen.getByRole('button', 'Sign out').first().tap();
  await screen.getByRole('alertdialog').getByRole('button', 'Sign out').tap();
  await expect(rows()).toHaveCount(2);
  await expect(screen.getByText('Signed out of that device.')).toBeVisible();

  await screen.getByRole('button', 'Sign out of all other devices').tap();
  await screen
    .getByRole('alertdialog')
    .getByRole('button', 'Sign out of all other devices')
    .tap();
  await expect(rows()).toHaveCount(1);
  await expect(
    screen.getByRole('button', 'Sign out of all other devices')
  ).toBeHidden();
});
