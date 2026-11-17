import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

import {
  addMember,
  assignRole,
  createRole,
  createTenant,
  signInAs,
  signUp,
  unique,
} from './support/api.ts';

test('a member with no role sees only Overview and is denied the managed pages', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const member = await addMember(owner, tenant, 'No Role Member');

  await signInAs(browser, member);
  await app.open('/');

  const nav = screen.getByRole('navigation', 'Workspace');
  await expect(nav.getByRole('link', 'Overview')).toBeVisible();
  await expect(nav.getByRole('link', 'Members')).toBeHidden();
  await expect(nav.getByRole('link', 'Invitations')).toBeHidden();
  await expect(nav.getByRole('link', 'Roles')).toBeHidden();

  for (const path of ['members', 'roles', 'invitations']) {
    await app.open(`/${path}`);
    await expect(
      screen.getByRole('heading', 'You don’t have access')
    ).toBeVisible();
  }
});

test('a member with only members.manage sees Members and Invitations but not Roles', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const role = await createRole(owner, tenant, unique('Support'), [
    'members.manage',
  ]);
  const member = await addMember(owner, tenant, 'Support Agent');
  await assignRole(owner, tenant, member.id, role.id);

  await signInAs(browser, member);
  await app.open('/');

  const nav = screen.getByRole('navigation', 'Workspace');
  await expect(nav.getByRole('link', 'Members')).toBeVisible();
  await expect(nav.getByRole('link', 'Invitations')).toBeVisible();
  await expect(nav.getByRole('link', 'Roles')).toBeHidden();

  await app.open('/roles');
  await expect(
    screen.getByRole('heading', 'You don’t have access')
  ).toBeVisible();
});

test('a remembered workspace the user is not in falls back to their own', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const foreign = await createTenant(owner);
  const outsider = await signUp('Outsider');
  const own = await createTenant(outsider);

  await signInAs(browser, outsider, foreign);
  await app.open('/');

  await expect(
    screen.getByRole('heading', own.name, { level: 1 })
  ).toBeVisible();
  await expect(
    screen.getByRole('button', `Workspace: ${own.name}`)
  ).toBeVisible();
});
