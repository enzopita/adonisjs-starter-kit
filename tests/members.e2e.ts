import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

import {
  addMember,
  createRole,
  createTenant,
  signInAs,
  signUp,
} from './support/api.ts';

test("changes a member's role and it persists after reload", async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const role = await createRole(owner, tenant);
  const member = await addMember(owner, tenant, 'Ada Lovelace');
  const select = () =>
    screen.getByRole('combobox', `Role for ${member.fullName}`);

  await signInAs(browser, owner);
  await app.open('/members');

  await select().tap();
  await screen.getByRole('option', role.name).tap();
  await expect(select()).toHaveText(role.name);

  await browser.reload();
  await expect(select()).toHaveText(role.name);
});

test('edits a member’s grants and they persist after reload', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const member = await addMember(owner, tenant, 'Grace Hopper');
  const row = () => screen.getByRole('row').filter({ hasText: member.email });

  await signInAs(browser, owner);
  await app.open('/members');

  await screen
    .getByRole('button', `Edit permissions for ${member.fullName}`)
    .tap();
  await screen.getByRole('checkbox', 'Manage roles', { exact: false }).check();
  await screen.getByRole('button', 'Save').tap();

  await expect(screen.getByRole('dialog')).toBeHidden();
  await expect(row().getByText('Manage roles')).toBeVisible();

  await browser.reload();
  await expect(row().getByText('Manage roles')).toBeVisible();
});

test('demoting the last manager shows the error and keeps their role', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  await createTenant(owner);
  const select = () =>
    screen.getByRole('combobox', `Role for ${owner.fullName}`);

  await signInAs(browser, owner);
  await app.open('/members');

  const row = screen.getByRole('row').filter({ hasText: owner.email });
  await expect(row.getByText('You')).toBeVisible();

  await select().tap();
  await screen.getByRole('option', 'No role').tap();

  await expect(
    screen.getByText(
      'Someone must still be able to manage members. Give that permission to another member first.'
    )
  ).toBeVisible();
  await expect(select()).toHaveText('Owner');
});
