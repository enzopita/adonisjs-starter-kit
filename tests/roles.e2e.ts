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

test('creates a role and it appears with its permissions', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  await createTenant(owner);
  const name = unique('Editor');

  await signInAs(browser, owner);
  await app.open('/roles');

  await screen.getByRole('button', 'New role').tap();
  await screen
    .getByRole('dialog', 'New role')
    .getByLabel('Role name')
    .fill(name);
  await screen.getByRole('checkbox', 'Manage roles', { exact: false }).check();
  await screen.getByRole('button', 'Create role').tap();

  await expect(screen.getByRole('dialog')).toBeHidden();
  const row = screen.getByRole('row').filter({ hasText: name });
  await expect(row).toBeVisible();
  await expect(row.getByText('Manage roles')).toBeVisible();
  await expect(row.getByText('Manage members')).toBeHidden();
});

test('renames a role and changes its permissions', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const role = await createRole(owner, tenant, unique('Viewer'), []);
  const renamed = unique('Contributor');

  await signInAs(browser, owner);
  await app.open('/roles');

  await screen.getByRole('button', `Edit ${role.name}`).tap();
  const dialog = screen.getByRole('dialog', 'Edit role');
  await dialog.getByLabel('Role name').fill(renamed);
  await screen
    .getByRole('checkbox', 'Manage members', { exact: false })
    .check();
  await screen.getByRole('button', 'Save').tap();

  await expect(screen.getByRole('dialog')).toBeHidden();
  const row = screen.getByRole('row').filter({ hasText: renamed });
  await expect(row).toBeVisible();
  await expect(row.getByText('Manage members')).toBeVisible();
});

test('deletes an unused role after confirming', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const role = await createRole(owner, tenant, unique('Temp'), []);

  await signInAs(browser, owner);
  await app.open('/roles');

  await screen.getByRole('button', `Delete ${role.name}`).tap();
  await screen
    .getByRole('alertdialog', `Delete “${role.name}”?`)
    .getByRole('button', 'Delete role')
    .tap();

  await expect(
    screen.getByRole('row').filter({ hasText: role.name })
  ).toBeHidden();
});

test('a role in use cannot be deleted', async ({ app, screen, browser }) => {
  const owner = await signUp();
  const tenant = await createTenant(owner);
  const role = await createRole(owner, tenant, unique('Staff'), []);
  const member = await addMember(owner, tenant);
  await assignRole(owner, tenant, member.id, role.id);

  await signInAs(browser, owner);
  await app.open('/roles');

  await screen.getByRole('button', `Delete ${role.name}`).tap();
  await screen
    .getByRole('alertdialog', `Delete “${role.name}”?`)
    .getByRole('button', 'Delete role')
    .tap();

  await expect(
    screen.getByText(
      'Move this role’s members to another role before deleting it.'
    )
  ).toBeVisible();

  await screen.getByRole('alertdialog').getByRole('button', 'Cancel').tap();
  await expect(
    screen.getByRole('row').filter({ hasText: role.name })
  ).toBeVisible();
});
