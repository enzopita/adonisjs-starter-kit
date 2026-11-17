/**
 * Retakes the README screenshots in docs/images/: a fresh demo database, a fixed dataset seeded
 * through the API, the app served against it, and agent-browser capturing each screen.
 *
 * Needs Docker, `agent-browser` on the PATH, and free ports 3333 and 5173. Deletes Mailpit's mail
 * to the demo addresses only.
 */
import { execFile, execFileSync, spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { mkdtempSync, openSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import {
  api,
  createRole,
  createTenant,
  enableTwoFactor,
  grantPlatformAdmin,
  invitationToken,
  invite,
  verifyEmailToken,
} from '../tests/support/api.ts'
import type { Account } from '../tests/support/api.ts'

const ROOT = new URL('..', import.meta.url).pathname
const BACKEND_DIR = join(ROOT, 'apps/backend')
const FRONTEND_DIR = join(ROOT, 'apps/frontend')
const IMAGES_DIR = join(ROOT, 'docs/images')
const LOG_DIR = mkdtempSync(join(tmpdir(), 'starter-screenshots-'))

const APP_URL = 'http://localhost:5173'
const BACKEND_URL = 'http://localhost:3333'
const MAILPIT_URL = 'http://localhost:8025/api/v1'
const BROWSER_SESSION = 'starter-screenshots'

/**
 * Read by every backend process this script starts, `node ace admin:grant` included. Mail and
 * jobs run in-process, so no queue worker is needed, and the rate limiter forgets every rerun.
 */
const DEMO_ENV = {
  DB_DATABASE: 'starter_demo',
  QUEUE_DRIVER: 'sync',
  LIMITER_STORE: 'memory',
}

const PASSWORD = 'lovelace-demo-password'

const PEOPLE = {
  ada: { fullName: 'Ada Lovelace', email: 'ada@example.com', timezone: 'Europe/London' },
  grace: { fullName: 'Grace Hopper', email: 'grace@example.com', timezone: 'America/New_York' },
  margaret: { fullName: 'Margaret Hamilton', email: 'margaret@example.com' },
}

type Person = { fullName: string; email: string; timezone: string }

type Shot = {
  file: string
  path: string
  /** Text that appears only once the screen has its data. */
  ready: string
  signedOut?: boolean
  dark?: boolean
  locale?: 'en-US' | 'pt-BR'
  /** Captures only this element instead of the viewport. */
  element?: string
  /** Clicks this button (by its exact text) before waiting for `ready`. */
  click?: string
}

const WORKSPACE_SHOTS: Shot[] = [
  { file: 'sign-in.png', path: '/login', ready: 'Sign in', signedOut: true },
  { file: 'sign-in-dark.png', path: '/login', ready: 'Sign in', signedOut: true, dark: true },
  { file: 'workspace-overview.png', path: '/', ready: 'Lovelace Labs' },
  { file: 'members.png', path: '/members', ready: 'Grace Hopper' },
  { file: 'members-dark.png', path: '/members', ready: 'Grace Hopper', dark: true },
  { file: 'invitations.png', path: '/invitations', ready: PEOPLE.margaret.email },
  { file: 'roles-permissions.png', path: '/roles', ready: 'Viewer' },
  { file: 'audit-trail.png', path: '/audit', ready: 'Grace Hopper' },
  {
    file: 'two-factor-setup.png',
    path: '/profile',
    click: 'Enable',
    ready: 'secret manually',
    element: '[data-slot="card"]:has(.bg-white > svg)',
  },
]

const ADMIN_SHOTS: Shot[] = [
  { file: 'admin-workspaces.png', path: '/admin', ready: 'Lovelace Labs' },
  { file: 'admin-users.png', path: '/admin/users', ready: PEOPLE.grace.email },
]

const PT_BR_SHOTS: Shot[] = [
  { file: 'profile-preferences.png', path: '/profile', ready: 'Idioma', locale: 'pt-BR' },
]

const started: ChildProcess[] = []

function run(command: string, args: string[], cwd = ROOT) {
  execFileSync(command, args, { cwd, stdio: ['ignore', 'inherit', 'inherit'] })
}

/** Starts `command` in its own process group, so `stopAll` also ends the children it spawns. */
function start(name: string, command: string, args: string[], cwd: string) {
  const log = openSync(join(LOG_DIR, `${name}.log`), 'a')
  const child = spawn(command, args, { cwd, detached: true, stdio: ['ignore', log, log] })

  started.push(child)
  console.log(`started ${name} (pid ${child.pid}), log in ${join(LOG_DIR, `${name}.log`)}`)
}

function stopAll() {
  for (const child of started) {
    // Even when the leader exited: `node ace serve` can leave its server child in the group.
    if (child.pid !== undefined) {
      try {
        process.kill(-child.pid, 'SIGTERM')
      } catch {
        // Already gone.
      }
    }
  }

  started.length = 0

  try {
    execFileSync('agent-browser', ['--session', BROWSER_SESSION, 'close'], { stdio: 'ignore' })
  } catch {
    // No browser was open.
  }
}

async function isListening(url: string) {
  try {
    await fetch(url)

    return true
  } catch {
    return false
  }
}

async function waitFor(url: string, name: string) {
  const deadline = Date.now() + 120_000

  while (!(await isListening(url))) {
    if (Date.now() > deadline) throw new Error(`${name} did not answer at ${url}; see ${LOG_DIR}`)

    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

/** Drops and recreates the demo database, so every run seeds the same rows into an empty schema. */
function resetDatabase() {
  const psql = (sql: string) =>
    run('docker', [
      'compose',
      'exec',
      '-T',
      'pgsql',
      'sh',
      '-c',
      `psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres -c '${sql}'`,
    ])

  psql(`DROP DATABASE IF EXISTS ${DEMO_ENV.DB_DATABASE} WITH (FORCE)`)
  psql(`CREATE DATABASE ${DEMO_ENV.DB_DATABASE}`)
  // database/schema.ts is committed and generated from the main database; leave it alone.
  run('node', ['ace', 'migration:run', '--no-schema-generate', '--compact-output'], BACKEND_DIR)
}

/** Mailpit outlives the database: an old run's verification link would point at a deleted token. */
async function clearDemoMail() {
  for (const { email } of Object.values(PEOPLE)) {
    const query = encodeURIComponent(`to:"${email}"`)
    await fetch(`${MAILPIT_URL}/search?query=${query}`, { method: 'DELETE' })
  }
}

async function signUpVerified(person: Person): Promise<Account> {
  const { user, token } = await api<{ user: { id: string; initials: string }; token: string }>(
    '/auth/signup',
    {
      body: {
        fullName: person.fullName,
        email: person.email,
        password: PASSWORD,
        passwordConfirmation: PASSWORD,
        locale: 'en-US',
        timezone: person.timezone,
      },
    },
  )

  await api('/auth/email/verify', { body: { token: await verifyEmailToken(person.email) } })

  return { ...person, id: user.id, initials: user.initials, password: PASSWORD, token }
}

async function seed() {
  const ada = await signUpVerified(PEOPLE.ada)
  const grace = await signUpVerified(PEOPLE.grace)
  const tenant = await createTenant(ada, 'Lovelace Labs')

  const editor = await createRole(ada, tenant, 'Editor', ['members.manage', 'audit.view'])
  const viewer = await createRole(ada, tenant, 'Viewer', ['audit.view'])

  await invite(ada, tenant, grace.email, editor.id)
  await api('/invitations/accept', {
    method: 'POST',
    token: grace.token,
    body: { token: await invitationToken(grace.email) },
  })
  await invite(ada, tenant, PEOPLE.margaret.email, viewer.id)

  return { ada, tenant }
}

/**
 * Async on purpose: a blocking call would stall the event loop, which then misses the backend
 * closing an idle keep-alive socket, and the next API call fails on that dead socket.
 */
async function browser(...args: string[]) {
  await promisify(execFile)('agent-browser', ['--session', BROWSER_SESSION, ...args])
}

/** The frontend's persisted zustand stores, as tests/support/api.ts seeds them. */
function persisted(state: Record<string, string | null>) {
  return JSON.stringify({ state, version: 1 })
}

async function capture(shots: Shot[], ada: Account, tenantId: string) {
  for (const shot of shots) {
    const storage = {
      'starter:session': shot.signedOut ? null : persisted({ token: ada.token }),
      'starter:last-workspace': persisted({ tenantId }),
      'starter:preferences': persisted({
        locale: shot.locale ?? 'en-US',
        timeZone: shot.signedOut ? null : PEOPLE.ada.timezone,
      }),
    }

    await browser(
      'eval',
      `for (const [key, value] of Object.entries(${JSON.stringify(storage)})) value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value)`,
    )
    await browser('set', 'media', shot.dark ? 'dark' : 'light')
    await browser('open', `${APP_URL}${shot.path}`)

    if (shot.click) {
      const label = JSON.stringify(shot.click)
      await browser(
        'wait',
        '--fn',
        `[...document.querySelectorAll('button')].some(button => button.textContent.trim() === ${label})`,
      )
      await browser('find', 'role', 'button', 'click', '--name', shot.click, '--exact')
    }

    await browser('wait', '--text', shot.ready)
    // Fonts, images, and the enter transitions settle after the data arrives.
    await browser('wait', '--load', 'networkidle')
    await browser('wait', '500')

    const target = join(IMAGES_DIR, shot.file)

    if (shot.element) {
      // agent-browser clips an element below the fold or on a scrolled page wrong, so make the
      // viewport tall enough to hold the whole page unscrolled.
      await browser('set', 'viewport', '1440', '2400')
      await browser('screenshot', shot.element, target)
      await browser('set', 'viewport', '1440', '900')
    } else {
      await browser('screenshot', target)
    }

    console.log(`captured ${shot.file}`)
  }
}

async function main() {
  for (const url of [BACKEND_URL, APP_URL]) {
    if (await isListening(url)) {
      throw new Error(
        `${url} is already in use; stop that server first, this script starts its own`,
      )
    }
  }

  // Compose interpolates DB_DATABASE into the pgsql container, so the demo values must not be set
  // yet or `up` recreates the dev container around the demo database.
  run('docker', ['compose', 'up', '-d', '--wait'])
  Object.assign(process.env, DEMO_ENV)
  resetDatabase()
  await clearDemoMail()

  start('backend', 'node', ['ace', 'serve'], BACKEND_DIR)
  // A production build leaves out the TanStack devtools.
  run('pnpm', ['exec', 'vite', 'build', '--logLevel', 'warn'], FRONTEND_DIR)
  start(
    'frontend',
    'pnpm',
    ['exec', 'vite', 'preview', '--port', '5173', '--strictPort'],
    FRONTEND_DIR,
  )
  await waitFor(BACKEND_URL, 'backend')
  await waitFor(APP_URL, 'frontend')

  const { ada, tenant } = await seed()

  await browser('set', 'viewport', '1440', '900')
  await browser('open', `${APP_URL}/login`)

  await capture(WORKSPACE_SHOTS, ada, tenant.id)

  // The admin area refuses a platform admin without two-factor, which also hides the enrollment card.
  await enableTwoFactor(ada)
  await grantPlatformAdmin(ada)
  await capture(ADMIN_SHOTS, ada, tenant.id)

  await api('/account/profile', { method: 'PATCH', token: ada.token, body: { locale: 'pt-BR' } })
  await capture(PT_BR_SHOTS, ada, tenant.id)
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    stopAll()
    process.exit(1)
  })
}

try {
  await main()
} finally {
  stopAll()
}
