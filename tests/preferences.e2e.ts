import { randomUUID } from 'node:crypto';

import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

import { api, signInAs, signUp, unique } from './support/api.ts';

test('a member changes their time zone and their language from the profile page', async ({
  screen,
  app,
  browser,
}) => {
  const member = await signUp('Ada Lovelace');

  await signInAs(browser, member);
  await app.open('/profile');

  const timeZoneSelect = () => screen.getByRole('combobox', 'Time zone');
  const saved = () => screen.getByText('Preferences saved');
  // The signup row's own "When" detail is a fixed timestamp this test can read in each zone.
  const signupRow = screen
    .getByRole('listitem')
    .filter({ hasText: 'created their account' });

  await signupRow.getByText('Details').tap();
  const beforeAnyChange = await signupRow.textContent();

  let kiritimati = beforeAnyChange;

  await timeZoneSelect().tap();
  await screen.getByRole('option', '(UTC+14:00) Pacific/Kiritimati').tap();
  await expect(saved()).toBeVisible();
  await expect
    .poll(async () => {
      kiritimati = await signupRow.textContent();

      return kiritimati;
    })
    .not.toBe(beforeAnyChange);

  await timeZoneSelect().tap();
  await screen.getByRole('option', '(UTC-09:00) America/Adak').tap();
  await expect(saved()).toBeVisible();
  await expect.poll(() => signupRow.textContent()).not.toBe(kiritimati);

  await screen.getByRole('combobox', 'Language').tap();
  await screen.getByRole('option', 'Português (Brasil)').tap();
  await expect(screen.getByRole('heading', 'Perfil')).toBeVisible();
  await expect(screen.getByText('Preferências')).toBeVisible();
});

// Regression: on a shared browser, signing out after choosing pt-BR left that choice as the
// stored "locale", and a fresh signup sent it as the new account's own choice.
test('signing out and signing up again does not inherit the previous account’s language', async ({
  screen,
  app,
  browser,
}) => {
  const member = await signUp('Lena Leaver');

  await signInAs(browser, member);
  await app.open('/profile');
  await screen.getByRole('combobox', 'Language').tap();
  await screen.getByRole('option', 'Português (Brasil)').tap();
  await expect(screen.getByRole('heading', 'Perfil')).toBeVisible();

  await screen.getByRole('button', 'Menu da conta').tap();
  await screen.getByRole('menuitem', 'Sair').tap();
  await expect(browser).toHaveURL(/\/login/);

  await screen.getByRole('link', 'Crie uma').tap();
  await screen.getByRole('textbox', 'Nome completo').fill('Noor New');
  await screen
    .getByRole('textbox', 'E-mail')
    .fill(`${randomUUID()}@example.com`);
  await screen.getByRole('textbox', 'Senha').fill('password123');
  await screen.getByRole('textbox', 'Confirmar senha').fill('password123');
  await screen.getByRole('button', 'Criar conta').tap();

  // The signup form itself still rendered in pt-BR (the login page's own language choice, kept
  // on purpose). The new account's stored locale must be the browser's own (en-US here), not
  // the leftover pt-BR: once the app loads, it reads that mismatch, corrects the stored UI
  // language and reloads into English, landing here on the English workspace onboarding page.
  await expect(
    screen.getByRole('heading', 'Create your workspace')
  ).toBeVisible();
});

// Regression: with storage blocked, an account language other than the browser's reloaded the
// page right after sign-in, and the reload dropped the in-memory session: the member landed back
// on the login form every time.
test('with browser storage blocked, a member whose language differs from the browser’s stays signed in', async ({
  screen,
  app,
  browser,
}) => {
  const member = await signUp('Bea Blocked');
  const name = unique('Blocked');

  await api('/account/profile', {
    method: 'PATCH',
    token: member.token,
    body: { locale: 'pt-BR', timezone: 'UTC' },
  });
  await browser.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage is blocked', 'SecurityError');
      },
    });
  });

  await app.open('/login');
  await screen.getByLabel('Email').fill(member.email);
  await screen.getByLabel('Password').fill(member.password);
  await screen.getByRole('button', 'Sign in').tap();

  await screen.getByLabel('Workspace name').fill(name);
  await screen.getByRole('button', 'Create workspace').tap();
  await expect(screen.getByRole('heading', name, { level: 1 })).toBeVisible();
});

// Regression: an account missing a stored language or time zone (signed up before those columns
// existed; the API helper's accounts have no zone) got them written back but skipped the reload,
// so it rendered in the previous account's language left in this browser.
test('an account missing its preferences renders in its own language, not the previous account’s', async ({
  screen,
  app,
  browser,
}) => {
  await browser.addInitScript(() => {
    if (sessionStorage.getItem('e2e:seeded-preferences')) return;

    localStorage.setItem(
      'starter:preferences',
      JSON.stringify({ state: { locale: 'pt-BR', timeZone: null }, version: 1 })
    );
    sessionStorage.setItem('e2e:seeded-preferences', '1');
  });
  await signInAs(browser, await signUp('Lee Legacy'));
  await app.open('/');

  await expect(
    screen.getByRole('heading', 'Create your workspace')
  ).toBeVisible();
});
