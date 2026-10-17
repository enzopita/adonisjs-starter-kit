import type { Browser } from '@e2e-dev/web'
import { expect } from 'e2e'
import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { promisify } from 'node:util'

/** Arrange steps go straight to the API; only the behavior under test goes through the UI. */
export const API_URL = 'http://localhost:3333/api/v1'

const MAILPIT_URL = 'http://localhost:8025/api/v1'

export type Account = {
  id: string
  fullName: string
  email: string
  password: string
  initials: string
  token: string
}

export type Tenant = { id: string; name: string }

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  token?: string
  tenantId?: string
  body?: Record<string, string | string[] | null>
}

/** A run-unique value, so retries and replays never collide with earlier data. */
export function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`
}

export function uniqueEmail(prefix = 'e2e') {
  return `${unique(prefix)}@example.test`
}

/**
 * Calls the API and returns the `data` of a 2xx response; any other status throws with the body,
 * so a broken arrange step fails at its own line.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })

  if (options.body) headers.set('Content-Type', 'application/json')

  if (options.token) headers.set('Authorization', `Bearer ${options.token}`)

  if (options.tenantId) headers.set('X-Tenant-Id', options.tenantId)

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? (options.body ? 'POST' : 'GET'),
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    throw new Error(
      `${options.method ?? 'GET'} ${path} answered ${response.status}: ${await response.text()}`,
    )
  }

  // SAFETY: the caller names the `data` type of the endpoint it calls; the API wraps every 2xx body in `data`.
  return ((await response.json()) as { data: T }).data
}

export async function signUp(fullName = 'E2E Member'): Promise<Account> {
  const email = uniqueEmail()
  const password = randomUUID().slice(0, 24)

  const { user, token } = await api<{ user: { id: string; initials: string }; token: string }>(
    '/auth/signup',
    { body: { fullName, email, password, passwordConfirmation: password } },
  )

  return { id: user.id, initials: user.initials, fullName, email, password, token }
}

/** A workspace owned by `account`, which holds every permission in it. */
export function createTenant(account: Account, name = unique('Workspace')) {
  return api<Tenant>('/tenants', { token: account.token, body: { name } })
}

const BACKEND_DIR = new URL('../../apps/backend/', import.meta.url)

/** Makes `account` a platform admin the way an operator makes the first one, from the command line. */
export async function grantPlatformAdmin(account: Account) {
  await promisify(execFile)('node', ['ace', 'admin:grant', account.email], { cwd: BACKEND_DIR })
}

export type Role = { id: string; name: string; permissions: string[] }

export function createRole(
  owner: Account,
  tenant: Tenant,
  name = unique('Role'),
  permissions: string[] = [],
) {
  return api<Role>('/roles', {
    method: 'POST',
    token: owner.token,
    tenantId: tenant.id,
    body: { name, permissions },
  })
}

export function updateRole(
  owner: Account,
  tenant: Tenant,
  roleId: string,
  name: string,
  permissions: string[] = [],
) {
  return api<Role>(`/roles/${roleId}`, {
    method: 'PUT',
    token: owner.token,
    tenantId: tenant.id,
    body: { name, permissions },
  })
}

export function assignRole(owner: Account, tenant: Tenant, userId: string, roleId: string | null) {
  return api(`/members/${userId}/role`, {
    method: 'PUT',
    token: owner.token,
    tenantId: tenant.id,
    body: { roleId },
  })
}

/**
 * A fresh account invited into `tenant` and accepting through the API, the only way to add a
 * member: there's no direct "add to tenant" endpoint.
 */
export async function addMember(owner: Account, tenant: Tenant, fullName = 'E2E Member') {
  const member = await signUp(fullName)

  await api('/invitations', {
    method: 'POST',
    token: owner.token,
    tenantId: tenant.id,
    body: { email: member.email, roleId: null },
  })

  const token = await invitationToken(member.email)
  await api('/invitations/accept', { method: 'POST', token: member.token, body: { token } })

  return member
}

/** The frontend's persisted stores (zustand `persist`): one localStorage key each, `{ state, version }`. */
const SESSION_KEY = 'starter:session'
const WORKSPACE_KEY = 'starter:last-workspace'

function persisted(state: Record<string, string | null>) {
  return JSON.stringify({ state, version: 1 })
}

/**
 * Signs the browser in as `account` without the login form: the token is stored before the
 * app's first page load. Only that first load seeds it, so logging out later sticks. With
 * `tenant`, that workspace is also the one the app opens.
 */
export async function signInAs(browser: Browser, account: Account, tenant?: Tenant) {
  const seeds = [[SESSION_KEY, persisted({ token: account.token })]]

  if (tenant) seeds.push([WORKSPACE_KEY, persisted({ tenantId: tenant.id })])

  await browser.addInitScript(entries => {
    if (sessionStorage.getItem('e2e:seeded')) return

    for (const [key, value] of entries) localStorage.setItem(key, value)
    sessionStorage.setItem('e2e:seeded', '1')
  }, seeds)
}

/**
 * Switches the browser to `account`'s token, for a flow that moves between identities (inviter,
 * invitee) in one test. It writes at once, unlike `signInAs`'s one-time seed, and the app reads it
 * on the next `app.open`.
 */
export async function switchAccount(browser: Browser, account: Account) {
  await browser.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [SESSION_KEY, persisted({ token: account.token })],
  )
}

/**
 * Drops the browser's token directly, leaving a page that renders signed out after the next
 * `app.open`, without revoking it server-side the way the UI's "Log out" does: a token this test
 * switches back to later still works.
 */
export async function signOut(browser: Browser) {
  await browser.evaluate(key => localStorage.removeItem(key), SESSION_KEY)
}

/** Reads the newest invitation mailed to `email`; throws until the queue worker has sent it. */
async function readInvitationToken(email: string) {
  const search = await fetch(`${MAILPIT_URL}/search?query=${encodeURIComponent(`to:"${email}"`)}`)
  // SAFETY: Mailpit's search answers { messages: [{ ID }] }, newest first.
  const { messages } = (await search.json()) as { messages: { ID: string }[] }
  const [newest] = messages

  if (!newest) throw new Error(`No mail to ${email} in Mailpit yet`)

  const message = await fetch(`${MAILPIT_URL}/message/${newest.ID}`)
  // SAFETY: Mailpit's message endpoint answers the plain-text and HTML bodies.
  const { Text, HTML } = (await message.json()) as { Text: string; HTML: string }
  const token = /\/invitations\/([^\s"'<>]+)/.exec(`${Text}\n${HTML}`)?.[1]

  if (!token) throw new Error(`The mail to ${email} has no /invitations/<token> link`)

  return token
}

export async function invitationToken(email: string) {
  let token = ''

  await expect
    .poll(
      async () => {
        token = await readInvitationToken(email)

        return token
      },
      { timeout: 15_000, message: `an invitation mail to ${email}` },
    )
    .toBeTruthy()

  return token
}
