import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

import { createTenant, signInAs, signUp, unique } from './support/api.ts';

test('onboarding creates the first workspace and opens it', async ({
  app,
  screen,
  browser,
}) => {
  const name = unique('Acme');

  await signInAs(browser, await signUp());
  await app.open('/');
  await expect(browser).toHaveURL('/onboarding');
  await screen.getByLabel('Workspace name').fill(name);
  await screen.getByRole('button', 'Create workspace').tap();

  await expect(browser).toHaveURL('/');
  await expect(screen.getByRole('heading', name, { level: 1 })).toBeVisible();
  await expect(screen.getByRole('button', `Workspace: ${name}`)).toBeVisible();

  // Once onboarding rendered, the router kept it cached and showed it again on the next visit to
  // the home page until its redirect ran: the logo flashed the form for a workspace that exists.
  await browser.evaluate(() => {
    new MutationObserver(() => {
      if (document.querySelector('h1')?.textContent === 'Create your workspace')
        document.documentElement.dataset.onboardingShown = 'true';
    }).observe(document.body, { childList: true, subtree: true });

    return null;
  });
  await screen.getByRole('link', 'Starter').tap();
  await expect(screen.getByRole('heading', name, { level: 1 })).toBeVisible();
  expect(
    await browser.evaluate(
      () => document.documentElement.dataset.onboardingShown ?? 'false'
    )
  ).toBe('false');
});

test('the switcher creates a second workspace and switches between them', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp();
  const first = await createTenant(owner);
  const second = unique('Second');

  await signInAs(browser, owner);
  await app.open('/members');
  await expect(
    screen.getByRole('button', `Workspace: ${first.name}`)
  ).toBeVisible();

  await screen.getByRole('button', `Workspace: ${first.name}`).tap();
  await screen.getByRole('menuitem', 'New workspace').tap();
  await screen
    .getByRole('dialog', 'New workspace')
    .getByLabel('Workspace name')
    .fill(second);
  await screen.getByRole('button', 'Create workspace').tap();
  await expect(screen.getByRole('heading', second, { level: 1 })).toBeVisible();
  await expect(screen.getByRole('dialog')).toBeHidden();

  await screen.getByRole('button', `Workspace: ${second}`).tap();
  await screen.getByRole('menuitem', first.name).tap();
  await expect(browser).toHaveURL('/');
  await expect(
    screen.getByRole('heading', first.name, { level: 1 })
  ).toBeVisible();

  await app.open('/');
  await expect(
    screen.getByRole('heading', first.name, { level: 1 })
  ).toBeVisible();
});
