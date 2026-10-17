import { test } from '@e2e-dev/web'
import { expect } from 'e2e'
import { signInAs, signUp } from './support/api.ts'

test('a member uploads a photo, removes it, and reads both in their account activity', async ({
  app,
  screen,
  browser,
}) => {
  const member = await signUp('Alan Turing')

  await signInAs(browser, member)
  await app.open('/profile')
  const main = screen.getByRole('main')
  // The photo card comes first; the activity rows below repeat the initials in their avatars.
  const initials = main.getByText(member.initials).first()

  await expect(initials).toBeVisible()

  await screen.getByLabel('Photo file').setInputFiles('tests/fixtures/avatar.png')
  await expect(screen.getByRole('img', 'Your photo')).toBeVisible({ timeout: 10_000 })
  await expect(screen.getByRole('button', 'Replace photo')).toBeVisible()

  await screen.getByRole('button', 'Remove photo').tap()
  await expect(initials).toBeVisible()
  await expect(screen.getByRole('img', 'Your photo')).toBeHidden()
  await expect(screen.getByRole('button', 'Upload photo')).toBeVisible()

  const activity = main.getByRole('listitem')
  await expect(activity.filter({ hasText: 'Alan Turing removed their photo' })).toBeVisible()
  await expect(activity.filter({ hasText: 'Alan Turing added a photo' })).toBeVisible()
})
