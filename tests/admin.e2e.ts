import { randomUUID } from 'node:crypto';

import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

import {
  api,
  createTenant,
  enableTwoFactor,
  grantPlatformAdmin,
  resetPasswordToken,
  signInAs,
  signOut,
  signUp,
  switchAccount,
} from './support/api.ts';

async function signUpAdmin() {
  const admin = await signUp('E2E Admin');
  await grantPlatformAdmin(admin);
  // The admin area refuses a platform admin without two-factor.
  await enableTwoFactor(admin);

  return admin;
}

const searchFor = (value: string) => `search=${encodeURIComponent(value)}`;

test('a suspended workspace locks its members out until it is reactivated', async ({
  app,
  screen,
  browser,
}) => {
  const admin = await signUpAdmin();
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const row = () => screen.getByRole('row').filter({ hasText: tenant.name });

  await signInAs(browser, owner);
  await app.open('/admin');
  await expect(
    screen.getByRole('heading', 'You don’t have access')
  ).toBeVisible();
  await screen.getByRole('button', 'Account menu').tap();
  await expect(screen.getByRole('menuitem', 'Profile')).toBeVisible();
  await expect(screen.getByRole('menuitem', 'Platform admin')).toBeHidden();

  await switchAccount(browser, admin);
  await app.open('/');
  await screen.getByRole('button', 'Account menu').tap();
  await screen.getByRole('menuitem', 'Platform admin').tap();
  await expect(
    screen.getByRole('heading', 'Workspaces', { level: 1 })
  ).toBeVisible();
  await app.open(`/admin?${searchFor(tenant.name)}`);
  await screen.getByRole('button', `Actions for ${tenant.name}`).tap();
  await screen.getByRole('menuitem', 'Suspend').tap();
  await screen.getByRole('alertdialog').getByRole('button', 'Suspend').tap();
  await expect(row().getByText('Suspended')).toBeVisible();

  await switchAccount(browser, owner);
  await app.open('/members');
  await expect(browser).toHaveURL('/workspace-suspended');
  await expect(
    screen.getByRole('heading', `“${tenant.name}” is suspended`)
  ).toBeVisible();

  await switchAccount(browser, admin);
  await app.open(`/admin?${searchFor(tenant.name)}`);
  await screen.getByRole('button', `Actions for ${tenant.name}`).tap();
  await screen.getByRole('menuitem', 'Reactivate').tap();
  await expect(row().getByText('Active')).toBeVisible();

  await switchAccount(browser, owner);
  await app.open('/workspace-suspended');
  await expect(browser).toHaveURL('/');
  await expect(
    screen.getByRole('heading', tenant.name, { level: 1 })
  ).toBeVisible();

  // Suspended while the member has it open: their next request's 403 sends them away too.
  await api(`/admin/tenants/${tenant.id}/suspension`, {
    method: 'POST',
    token: admin.token,
  });
  await screen
    .getByRole('navigation', 'Workspace')
    .getByRole('link', 'Members')
    .tap();
  await expect(browser).toHaveURL('/workspace-suspended');
});

test('a disabled user is signed out and refused at login until enabled again', async ({
  app,
  screen,
  browser,
}) => {
  const admin = await signUpAdmin();
  const user = await signUp('Dana Disabled');
  const row = () => screen.getByRole('row').filter({ hasText: user.email });

  const logIn = async () => {
    await screen.getByLabel('Email').fill(user.email);
    await screen.getByLabel('Password').fill(user.password);
    await screen.getByRole('button', 'Sign in').tap();
  };

  await signInAs(browser, admin);
  await app.open(`/admin/users?${searchFor(user.email)}`);
  await screen.getByRole('button', `Actions for ${user.fullName}`).tap();
  await screen.getByRole('menuitem', 'Disable').tap();
  await screen.getByRole('alertdialog').getByRole('button', 'Disable').tap();
  await expect(row().getByText('Disabled')).toBeVisible();

  // The user's session from before: disabling revoked its token.
  await switchAccount(browser, user);
  await app.open('/profile');
  await expect(browser).toHaveURL(/\/login/u);
  await logIn();
  await expect(screen.getByRole('alert')).toHaveText(
    'This account is disabled. Contact support to get access back.'
  );

  await switchAccount(browser, admin);
  await app.open(`/admin/users?${searchFor(user.email)}`);
  await screen.getByRole('button', `Actions for ${user.fullName}`).tap();
  await screen.getByRole('menuitem', 'Enable').tap();
  await expect(row().getByText('Active')).toBeVisible();

  await signOut(browser);
  await app.open('/login');
  await logIn();
  await expect(browser).toHaveURL('/onboarding');
});

test('an admin makes a user a platform admin and removes them again, never themself', async ({
  app,
  screen,
  browser,
}) => {
  const admin = await signUpAdmin();
  const user = await signUp('Pat Promoted');
  const row = () => screen.getByRole('row').filter({ hasText: user.email });

  await signInAs(browser, admin);
  await app.open(`/admin/users?${searchFor(user.email)}`);
  await screen.getByRole('button', `Actions for ${user.fullName}`).tap();
  await screen.getByRole('menuitem', 'Make platform admin').tap();
  await screen
    .getByRole('alertdialog')
    .getByRole('button', 'Make platform admin')
    .tap();
  await expect(row().getByText('Platform admin')).toBeVisible();

  await screen.getByRole('button', `Actions for ${user.fullName}`).tap();
  await screen.getByRole('menuitem', 'Remove platform admin').tap();
  await screen
    .getByRole('alertdialog')
    .getByRole('button', 'Remove platform admin')
    .tap();
  await expect(row().getByText('Active')).toBeVisible();

  await app.open(`/admin/users?${searchFor(admin.email)}`);
  await expect(
    screen
      .getByRole('row')
      .filter({ hasText: admin.email })
      .getByText('Platform admin')
  ).toBeVisible();
  await expect(
    screen.getByRole('button', `Actions for ${admin.fullName}`)
  ).toBeHidden();
});

test('an admin impersonates a member and comes back as themself', async ({
  app,
  screen,
  browser,
}) => {
  const admin = await signUpAdmin();
  const member = await signUp('Ivy Impersonated');
  const tenant = await createTenant(member);

  const banner = () =>
    screen.getByRole('status').filter({ hasText: 'You’re signed in as' });

  await signInAs(browser, admin);
  await app.open(`/admin?${searchFor(tenant.name)}`);
  await screen.getByRole('link', tenant.name).tap();
  await screen.getByRole('button', `Actions for ${member.fullName}`).tap();
  await screen.getByRole('menuitem', 'Impersonate').tap();

  await expect(banner()).toContainText(`${member.fullName} (${member.email})`);
  await expect(
    screen.getByRole('heading', tenant.name, { level: 1 })
  ).toBeVisible();

  // Regression: saving the preferences card while impersonating switched the admin's own
  // browser language instead of the member's, so the card must not show at all.
  await app.open('/profile');
  await expect(screen.getByRole('heading', 'Profile')).toBeVisible();
  await expect(screen.getByRole('combobox', 'Language')).toBeHidden();

  await banner().getByRole('button', 'Stop impersonating').tap();
  await expect(browser).toHaveURL('/admin/users');
  await expect(banner()).toBeHidden();
  await expect(
    screen.getByRole('heading', 'Users', { level: 1 })
  ).toBeVisible();

  // The browser is back on the admin's own token, which survives a reload.
  await browser.reload();
  await expect(
    screen.getByRole('heading', 'Users', { level: 1 })
  ).toBeVisible();

  await app.open(`/admin?${searchFor(tenant.name)}`);
  await screen.getByRole('link', tenant.name).tap();
  await screen.getByRole('button', `Actions for ${member.fullName}`).tap();
  await screen.getByRole('menuitem', 'Impersonate').tap();
  await expect(banner()).toBeVisible();
  await screen.getByRole('button', 'Account menu').tap();
  await screen.getByRole('menuitem', 'Log out').tap();
  await expect(browser).toHaveURL(/\/login/u);

  // Logging out while impersonating revoked the admin's token too.
  await switchAccount(browser, admin);
  await app.open('/admin/users');
  await expect(browser).toHaveURL(/\/login/u);
});

test('an admin resets a member’s two-factor and the member signs in again with a mailed new password', async ({
  app,
  screen,
  browser,
}) => {
  const admin = await signUpAdmin();
  const member = await signUp('Lou Lost-Device');
  await enableTwoFactor(member);
  const newPassword = randomUUID().slice(0, 24);
  const row = () => screen.getByRole('row').filter({ hasText: member.email });

  await signInAs(browser, admin);
  await app.open(`/admin/users?${searchFor(member.email)}`);
  await expect(row().getByText('On')).toBeVisible();
  await screen.getByRole('button', `Actions for ${member.fullName}`).tap();
  await screen.getByRole('menuitem', 'Reset two-factor').tap();
  await screen
    .getByRole('alertdialog')
    .getByRole('button', 'Reset two-factor')
    .tap();
  await expect(row().getByText('Off')).toBeVisible();

  await signOut(browser);
  await app.open('/login');
  await screen.getByLabel('Email').fill(member.email);
  await screen.getByLabel('Password').fill(member.password);
  await screen.getByRole('button', 'Sign in').tap();
  await expect(
    screen.getByText('Choose a new password before you sign in.', {
      exact: false,
    })
  ).toBeVisible();
  await expect(
    screen.getByRole('link', 'Ask for a new link to choose a password')
  ).toHaveAttribute('href', '/forgot-password');
  await expect(browser).toHaveURL('/login');

  await app.open(`/reset-password/${await resetPasswordToken(member.email)}`);
  await screen.getByLabel('New password').fill(newPassword);
  await screen.getByLabel('Confirm password').fill(newPassword);
  await screen.getByRole('button', 'Reset password').tap();
  await expect(browser).toHaveURL('/login');

  await screen.getByLabel('Email').fill(member.email);
  await screen.getByLabel('Password').fill(newPassword);
  await screen.getByRole('button', 'Sign in').tap();
  await expect(browser).toHaveURL('/onboarding');
});
