import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import type User from '#users/models/user'
import type { ApiClient } from '@japa/api-client'
import { workspace } from '#access/tests/seed'
import AuditEvent from '#core/models/audit_event'
import testUtils from '@adonisjs/core/services/test_utils'

type Workspace = Awaited<ReturnType<typeof workspace>>

type Seeded = {
  type: string
  actorId?: string
  subjectType?: string
  subjectId?: string
  createdAt?: DateTime
}

function seed(space: Workspace, { type, actorId, subjectType, subjectId, createdAt }: Seeded) {
  return AuditEvent.create({
    tenantId: space.tenant.id,
    type,
    actorId: actorId ?? null,
    subjectType: subjectType ?? null,
    subjectId: subjectId ?? null,
    data: {},
    createdAt,
  })
}

type ListQuery = {
  page?: number
  perPage?: number
  type?: string[]
  actorId?: string
  subjectType?: string
  subjectId?: string
  from?: string | null
  to?: string | null
}

async function setup() {
  const acme = await workspace()
  const auditor = await acme.member()
  await acme.grant(auditor, 'audit.view')

  return { acme, auditor }
}

function list(client: ApiClient, space: Workspace, viewer: User, query: ListQuery = {}) {
  return client.visit('audit.audit_events.index').qs(query).headers(space.headers).loginAs(viewer)
}

function typesOf(response: Awaited<ReturnType<typeof list>>) {
  return response.body().data.map((row: { event: { type: string } }) => row.event.type)
}

test.group('Audit | events', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  // Regression: the tenant's whole trail is readable by a member without audit.view.
  test('requires audit.view for the whole trail', async ({ client }) => {
    const { acme } = await setup()
    const roleManager = await acme.member()
    await acme.grant(roleManager, 'roles.manage')

    const response = await list(client, acme, roleManager)

    response.assertStatus(403)
  })

  // Regression: a feature permission stops opening its own subject's trail, or opens another's.
  test('lets a feature permission read the trail of its own subject type only', async ({
    client,
    assert,
  }) => {
    const { acme } = await setup()
    const roleManager = await acme.member()
    await acme.grant(roleManager, 'roles.manage')
    await seed(acme, { type: 'role.created', subjectType: 'role', subjectId: acme.tenant.id })
    await seed(acme, { type: 'member.joined', subjectType: 'member', subjectId: roleManager.id })

    const roles = await list(client, acme, roleManager, { subjectType: 'role' })
    const members = await list(client, acme, roleManager, { subjectType: 'member' })

    roles.assertStatus(200)
    assert.deepEqual(typesOf(roles), ['role.created'])
    members.assertStatus(403)
  })

  // Regression: one tenant's events show up in another's trail.
  test('lists only the events of the tenant in X-Tenant-Id', async ({ client, assert }) => {
    const { acme, auditor } = await setup()
    const globex = await workspace('Globex')
    await seed(acme, { type: 'role.created' })
    await seed(globex, { type: 'role.deleted' })

    const response = await list(client, acme, auditor)

    assert.deepEqual(typesOf(response), ['role.created'])
  })

  // Regression: a filter is ignored and the screen shows the whole trail.
  test('filters by type, actor, subject and date', async ({ client, assert }) => {
    const { acme, auditor } = await setup()
    const ana = await acme.member()
    const roleId = '01900000-0000-7000-8000-000000000001'
    const lastWeek = DateTime.now().minus({ days: 7 })

    await seed(acme, { type: 'role.created', subjectType: 'role', subjectId: roleId })
    await seed(acme, { type: 'role.updated', actorId: ana.id, createdAt: lastWeek })
    await seed(acme, { type: 'member.joined', actorId: ana.id })

    const queries: ListQuery[] = [
      { type: ['role.created', 'role.updated'] },
      { actorId: ana.id },
      { subjectType: 'role', subjectId: roleId },
      { to: lastWeek.plus({ minutes: 1 }).toISO() },
      { from: lastWeek.plus({ minutes: 1 }).toISO() },
    ]

    const filtered = []

    // One at a time: the test's global transaction is a single connection.
    for (const query of queries) filtered.push(typesOf(await list(client, acme, auditor, query)))

    assert.deepEqual(filtered, [
      ['role.updated', 'role.created'],
      ['member.joined', 'role.updated'],
      ['role.created'],
      ['role.updated'],
      ['member.joined', 'role.created'],
    ])
  })

  // Regression: pages overlap or come oldest first, or the meta misreports the total.
  test('pages the trail newest first', async ({ client, assert }) => {
    const { acme, auditor } = await setup()

    for (const type of ['role.created', 'role.updated', 'role.deleted']) {
      await seed(acme, { type })
    }

    const first = await list(client, acme, auditor, { perPage: 2 })
    const second = await list(client, acme, auditor, { perPage: 2, page: 2 })

    assert.deepEqual(typesOf(first), ['role.deleted', 'role.updated'])
    assert.deepEqual(typesOf(second), ['role.created'])
    assert.include(first.body().metadata, { total: 3, perPage: 2, currentPage: 1, lastPage: 2 })
  })

  // Regression: the actor or their avatar is missing from a row, or an event with no actor
  // breaks the list.
  test('embeds the actor, and null for an event nobody signed in did', async ({
    client,
    assert,
  }) => {
    const { acme, auditor } = await setup()
    await seed(acme, { type: 'role.created' })
    await seed(acme, { type: 'role.updated', actorId: auditor.id })

    const response = await list(client, acme, auditor)
    const [byAuditor, bySystem] = response.body().data

    assert.include(byAuditor?.actor, { id: auditor.id, email: auditor.email, avatar: null })
    assert.isNull(bySystem?.actor)
  })
})
