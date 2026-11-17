import { randomUUID } from 'node:crypto';

import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

import {
  addMember,
  api,
  createRole,
  createTenant,
  invitationToken,
  invite,
  signInAs,
  signUp,
  switchAccount,
  unique,
  uniqueEmail,
} from './support/api.ts';

test('invites by email and it shows as pending', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  await createTenant(owner);
  const email = uniqueEmail('invite');

  await signInAs(browser, owner);
  await app.open('/invitations');

  await screen.getByRole('button', 'Invite member').tap();
  await screen
    .getByRole('dialog', 'Invite member')
    .getByLabel('Email')
    .fill(email);
  await screen.getByRole('button', 'Send invitation').tap();

  await expect(screen.getByRole('dialog')).toBeHidden();
  await expect(screen.getByText(`Invitation sent to ${email}`)).toBeVisible();
  const row = screen.getByRole('row').filter({ hasText: email });
  await expect(row).toBeVisible();
  await expect(row.getByText('Pending')).toBeVisible();
});

test('re-inviting a pending email refreshes it and says so', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const role = await createRole(owner, tenant);
  const email = uniqueEmail('resend');

  await invite(owner, tenant, email);
  await signInAs(browser, owner);
  await app.open('/invitations');

  await screen.getByRole('button', 'Invite member').tap();
  const dialog = screen.getByRole('dialog', 'Invite member');
  await dialog.getByLabel('Email').fill(email);
  await dialog.getByRole('combobox', 'Role').tap();
  await screen.getByRole('option', role.name).tap();
  await screen.getByRole('button', 'Send invitation').tap();

  await expect(screen.getByRole('dialog')).toBeHidden();
  await expect(screen.getByText(`Invitation to ${email} resent`)).toBeVisible();
  const row = screen.getByRole('row').filter({ hasText: email });
  await expect(row).toHaveCount(1);
  await expect(row.getByText(role.name)).toBeVisible();
});

test('revokes an invitation after confirming', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const email = uniqueEmail('revoke');

  await invite(owner, tenant, email);
  await signInAs(browser, owner);
  await app.open('/invitations');

  await screen.getByRole('button', `Revoke invitation to ${email}`).tap();
  await screen
    .getByRole('alertdialog', `Revoke the invitation to ${email}?`)
    .getByRole('button', 'Revoke invitation')
    .tap();

  await expect(screen.getByRole('row').filter({ hasText: email })).toBeHidden();
});

test('inviting an existing member’s email shows the error', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const member = await addMember(owner, tenant);

  await signInAs(browser, owner);
  await app.open('/invitations');

  await screen.getByRole('button', 'Invite member').tap();
  await screen
    .getByRole('dialog', 'Invite member')
    .getByLabel('Email')
    .fill(member.email);
  await screen.getByRole('button', 'Send invitation').tap();

  await expect(
    screen.getByText('This person is already a member of the workspace.')
  ).toBeVisible();
  await expect(screen.getByRole('dialog', 'Invite member')).toBeVisible();
});

test('a new person opens the mailed link signed out, creates an account, and accepts', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);

  const role = await createRole(owner, tenant, unique('Support'), [
    'members.manage',
  ]);

  const email = uniqueEmail('newcomer');
  const password = randomUUID().slice(0, 24);

  await invite(owner, tenant, email, role.id);
  const token = await invitationToken(email);

  await app.open(`/invitations/${token}`);
  await expect(screen.getByRole('heading', 'You’re invited')).toBeVisible();
  await screen.getByRole('link', 'Create account').tap();
  await expect(browser).toHaveURL(`/signup?redirect=%2Finvitations%2F${token}`);

  await screen.getByLabel('Full name').fill('Ada Lovelace');
  await screen.getByLabel('Email').fill(email);
  await screen.getByLabel('Password').fill(password);
  await screen.getByLabel('Confirm password').fill(password);
  await screen.getByRole('button', 'Create account').tap();

  await expect(browser).toHaveURL(`/invitations/${token}`);
  await screen.getByRole('button', 'Accept invitation').tap();
  await expect(browser).toHaveURL('/');
  await expect(
    screen.getByRole('heading', tenant.name, { level: 1 })
  ).toBeVisible();

  await switchAccount(browser, owner);
  await app.open('/members');
  await expect(
    screen.getByRole('combobox', 'Role for Ada Lovelace')
  ).toHaveText(role.name);
});

test('an existing account signs in through the link and accepts', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const invitee = await signUp('Grace Hopper');

  await invite(owner, tenant, invitee.email);
  const token = await invitationToken(invitee.email);

  await app.open(`/invitations/${token}`);
  await screen.getByRole('link', 'Sign in').tap();
  await expect(browser).toHaveURL(`/login?redirect=%2Finvitations%2F${token}`);

  await screen.getByLabel('Email').fill(invitee.email);
  await screen.getByLabel('Password').fill(invitee.password);
  await screen.getByRole('button', 'Sign in').tap();

  await expect(browser).toHaveURL(`/invitations/${token}`);
  await screen.getByRole('button', 'Accept invitation').tap();
  await expect(browser).toHaveURL('/');
  await expect(
    screen.getByRole('heading', tenant.name, { level: 1 })
  ).toBeVisible();
});

test('the wrong signed-in account sees the mismatch state', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const invitedEmail = uniqueEmail('intended');
  const wrongAccount = await signUp('Wrong Person');

  await invite(owner, tenant, invitedEmail);
  const token = await invitationToken(invitedEmail);

  await signInAs(browser, wrongAccount);
  await app.open(`/invitations/${token}`);
  await screen.getByRole('button', 'Accept invitation').tap();

  await expect(screen.getByRole('heading', 'Wrong account')).toBeVisible();
  await expect(
    screen.getByText(wrongAccount.email, { exact: false })
  ).toBeVisible();

  await screen.getByRole('button', 'Sign in with another account').tap();
  await expect(browser).toHaveURL(`/login?redirect=%2Finvitations%2F${token}`);

  // Regression: the button only dropped the token from this browser, leaving it valid server-side.
  const outcome = await api('/account/profile', {
    token: wrongAccount.token,
  })
    .then(() => 'ok')
    .catch(String);

  expect(outcome).toContain('answered 401');
});

test('an unknown token shows the invalid state', async ({
  app,
  screen,
  browser,
}) => {
  await signInAs(browser, await signUp());
  await app.open(`/invitations/${randomUUID().replaceAll('-', '')}`);

  await screen.getByRole('button', 'Accept invitation').tap();

  await expect(
    screen.getByRole('heading', 'Invitation not found')
  ).toBeVisible();
  await screen.getByRole('link', 'Go home').tap();
  await expect(browser).toHaveURL('/onboarding');
});
