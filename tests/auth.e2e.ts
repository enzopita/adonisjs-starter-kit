import { randomUUID } from 'node:crypto';

import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

import {
  resetPasswordToken,
  signUp,
  uniqueEmail,
  verifyEmailToken,
} from './support/api.ts';

test('a visitor signs up and lands on workspace onboarding', async ({
  app,
  screen,
  browser,
}) => {
  const password = randomUUID().slice(0, 24);

  await app.open('/signup');
  await screen.getByLabel('Full name').fill('Ada Lovelace');
  await screen.getByLabel('Email').fill(uniqueEmail('signup'));
  await screen.getByLabel('Password').fill(password);
  await screen.getByLabel('Confirm password').fill(password);
  await screen.getByRole('button', 'Create account').tap();

  await expect(browser).toHaveURL('/onboarding');
  await expect(
    screen.getByRole('heading', 'Create your workspace')
  ).toBeVisible();
  await expect(screen.getByRole('button', 'Account menu')).toHaveText('AL');
});

test('signing up with a taken email shows the error on the email field', async ({
  app,
  screen,
}) => {
  const existing = await signUp();

  await app.open('/signup');
  await screen.getByLabel('Email').fill(existing.email);
  await screen.getByLabel('Password').fill(existing.password);
  await screen.getByLabel('Confirm password').fill(existing.password);
  await screen.getByRole('button', 'Create account').tap();

  await expect(screen.getByText('This is already taken.')).toBeVisible();
  await expect(screen.getByLabel('Email')).toHaveAttribute(
    'aria-invalid',
    'true'
  );
});

test('a member signs in, returns to the page they asked for, and logs out', async ({
  app,
  screen,
  browser,
}) => {
  const member = await signUp('Grace Hopper');

  await app.open('/profile');
  await expect(browser).toHaveURL('/login?redirect=%2Fprofile');

  await screen.getByLabel('Email').fill(member.email);
  await screen.getByLabel('Password').fill(member.password);
  await screen.getByRole('button', 'Sign in').tap();
  await expect(browser).toHaveURL('/profile');
  await expect(screen.getByText(member.email)).toBeVisible();

  await screen.getByRole('button', 'Account menu').tap();
  await screen.getByRole('menuitem', 'Log out').tap();
  await expect(browser).toHaveURL('/login');

  // The token is gone: the profile redirects to login again.
  await app.open('/profile');
  await expect(browser).toHaveURL(/\/login/);
});

test('a member resets a forgotten password from the mailed link and signs in with it', async ({
  app,
  screen,
  browser,
}) => {
  const member = await signUp();
  const newPassword = randomUUID().slice(0, 24);

  await app.open('/login');
  await screen.getByRole('link', 'Forgot password?').tap();
  await expect(browser).toHaveURL('/forgot-password');

  await screen.getByLabel('Email').fill(member.email);
  await screen.getByRole('button', 'Send reset link').tap();
  await expect(
    screen.getByText(
      'If an account uses this email, a link to reset its password is on its way.'
    )
  ).toBeVisible();

  const token = await resetPasswordToken(member.email);

  await app.open(`/reset-password/${token}`);
  await screen.getByLabel('New password').fill(newPassword);
  await screen.getByLabel('Confirm password').fill(newPassword);
  await screen.getByRole('button', 'Reset password').tap();

  await expect(browser).toHaveURL('/login');

  await screen.getByLabel('Email').fill(member.email);
  await screen.getByLabel('Password').fill(newPassword);
  await screen.getByRole('button', 'Sign in').tap();
  await expect(browser).toHaveURL('/onboarding');
});

test('a signed-up member sees the unverified banner until they open the mailed link', async ({
  app,
  screen,
  browser,
}) => {
  const email = uniqueEmail('verify');
  const password = randomUUID().slice(0, 24);

  await app.open('/signup');
  await screen.getByLabel('Full name').fill('Ada Lovelace');
  await screen.getByLabel('Email').fill(email);
  await screen.getByLabel('Password').fill(password);
  await screen.getByLabel('Confirm password').fill(password);
  await screen.getByRole('button', 'Create account').tap();

  await expect(
    screen.getByText(`we sent a link to ${email}`, { exact: false })
  ).toBeVisible();

  const token = await verifyEmailToken(email);

  // Regression: a failure other than a bad token left the page on "Verifying" with no way out.
  let failed = false;

  await browser.route(/\/api\/v1\/auth\/email\/verify$/, async (route) => {
    if (failed) return route.continue();

    failed = true;
    await route.abort();
  });
  await app.open(`/verify-email/${token}`);
  await expect(
    screen.getByRole('heading', 'Couldn’t verify your email')
  ).toBeVisible();
  await expect(
    screen.getByText('Can’t reach the server', { exact: false })
  ).toBeVisible();
  await screen.getByRole('button', 'Try again').tap();

  await expect(screen.getByRole('heading', 'Email verified')).toBeVisible();
  await screen.getByRole('link', 'Continue').tap();

  await expect(
    screen.getByText('we sent a link to', { exact: false })
  ).toBeHidden();
});
