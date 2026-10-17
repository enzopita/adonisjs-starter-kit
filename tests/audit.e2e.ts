import { test } from '@e2e-dev/web'
import { expect } from 'e2e'
import { createRole, createTenant, signInAs, signUp, unique, updateRole } from './support/api.ts'

test('a renamed role reads in its history and on the audit trail', async ({
  app,
  screen,
  browser,
}) => {
  const owner = await signUp('Ada Auditor')
  const tenant = await createTenant(owner)
  const role = await createRole(owner, tenant, unique('Editor'))
  const renamed = unique('Reviewer')
  await updateRole(owner, tenant, role.id, renamed)
  const renamedSentence = `Ada Auditor renamed the role “${role.name}” to “${renamed}”`
  const createdSentence = `Ada Auditor created the role “${role.name}”`

  await signInAs(browser, owner)
  await app.open('/roles')

  await screen.getByRole('button', `History of ${renamed}`).tap()
  const history = screen.getByRole('dialog', `History of ${renamed}`)
  await expect(history.getByRole('listitem').filter({ hasText: renamedSentence })).toBeVisible()
  await expect(history.getByRole('listitem').filter({ hasText: createdSentence })).toBeVisible()
  await history.getByRole('button', 'Close').tap()

  await screen.getByRole('link', 'Audit trail').tap()
  const trail = screen.getByRole('main').getByRole('listitem')
  await expect(trail.filter({ hasText: renamedSentence })).toBeVisible()

  await screen.getByRole('combobox', 'Event').tap()
  await screen.getByRole('option', 'Role created').tap()

  await expect(browser).toHaveURL(/event=role\.created/)
  await expect(trail.filter({ hasText: createdSentence })).toBeVisible()
  await expect(trail.filter({ hasText: renamedSentence })).toBeHidden()
})
