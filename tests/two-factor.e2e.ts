import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

import {
  api,
  grantPlatformAdmin,
  signInAs,
  signUp,
  totpCode,
} from './support/api.ts';

const RECOVERY_CODE = /^[a-z0-9]{5}-[a-z0-9]{5}$/;

test('a member enrolls two-factor from the profile, then signs in with a fresh code', async ({
  app,
  screen,
  browser,
}) => {
  const user = await signUp();

  await signInAs(browser, user);
  await app.open('/profile');

  await screen.getByRole('button', 'Enable').tap();
  const secret = await screen
    .getByLabel('Can’t scan it? Enter this secret manually')
    .inputValue();

  await screen.getByLabel('Password').fill(user.password);
  await screen.getByLabel('Code').fill(totpCode(secret));
  await screen.getByRole('button', 'Confirm').tap();

  await expect(
    screen.getByRole('heading', 'Save your recovery codes')
  ).toBeVisible();
  await expect(
    screen.getByRole('listitem').filter({ hasText: RECOVERY_CODE })
  ).toHaveCount(10);

  await screen.getByRole('button', 'I saved them').tap();
  await expect(
    screen.getByRole('button', 'Regenerate recovery codes')
  ).toBeVisible();

  // Regression: the dialog stayed mounted while closed, so reopening it still held what was typed.
  const disableDialog = screen.getByRole(
    'dialog',
    'Disable two-factor authentication?'
  );

  await screen.getByRole('button', 'Disable').tap();
  await disableDialog.getByLabel('Code').fill('123456');
  await disableDialog.getByRole('button', 'Close').tap();
  await expect(disableDialog).toBeHidden();
  await screen.getByRole('button', 'Disable').tap();
  await expect(disableDialog.getByLabel('Code')).toHaveValue('');
  await disableDialog.getByRole('button', 'Close').tap();

  await screen.getByRole('button', 'Account menu').tap();
  await screen.getByRole('menuitem', 'Log out').tap();
  await expect(browser).toHaveURL(/\/login/);

  await screen.getByLabel('Email').fill(user.email);
  await screen.getByLabel('Password').fill(user.password);
  await screen.getByRole('button', 'Sign in').tap();

  await expect(
    screen.getByRole('heading', 'Two-factor authentication')
  ).toBeVisible();
  await screen.getByLabel('Code').fill(totpCode(secret, 1));
  await screen.getByRole('button', 'Verify').tap();
  await expect(browser).toHaveURL('/onboarding');
});

test('a member signs in with a recovery code instead of their authenticator app', async ({
  app,
  screen,
  browser,
}) => {
  const user = await signUp();

  const { secret } = await api<{ secret: string }>('/account/two-factor', {
    method: 'POST',
    token: user.token,
  });

  const { recoveryCodes } = await api<{ recoveryCodes: string[] }>(
    '/account/two-factor/confirmation',
    {
      token: user.token,
      body: { password: user.password, code: totpCode(secret) },
    }
  );

  await app.open('/login');
  await screen.getByLabel('Email').fill(user.email);
  await screen.getByLabel('Password').fill(user.password);
  await screen.getByRole('button', 'Sign in').tap();

  await expect(
    screen.getByRole('heading', 'Two-factor authentication')
  ).toBeVisible();
  await screen.getByRole('button', 'Use a recovery code instead').tap();
  await screen.getByLabel('Recovery code').fill(recoveryCodes[0]);
  await screen.getByRole('button', 'Verify').tap();
  await expect(browser).toHaveURL('/onboarding');
});

test('a platform admin without two-factor sees the enroll prompt instead of the admin pages', async ({
  app,
  screen,
  browser,
}) => {
  const admin = await signUp('E2E Admin');
  await grantPlatformAdmin(admin);

  await signInAs(browser, admin);
  await app.open('/admin');

  await expect(
    screen.getByRole(
      'heading',
      'Turn on two-factor authentication to use the admin area'
    )
  ).toBeVisible();
  await expect(
    screen.getByRole('heading', 'Workspaces', { level: 1 })
  ).toBeHidden();

  await screen.getByRole('link', 'Set up two-factor authentication').tap();
  await expect(browser).toHaveURL(/\/profile/);
  await expect(
    screen.getByRole('heading', 'Two-factor authentication')
  ).toBeVisible();
});
