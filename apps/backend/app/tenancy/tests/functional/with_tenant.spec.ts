import vine from '@vinejs/vine'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import Tenant from '#tenancy/models/tenant'
import { compose } from '@adonisjs/core/helpers'
import { withTenant } from '#tenancy/mixins/with_tenant'
import testUtils from '@adonisjs/core/services/test_utils'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { existsInTenant } from '#tenancy/validators/exists_in_tenant'
import { runAsSystem, runInTenant } from '#tenancy/tenant_context'
import MissingTenantContextException from '#tenancy/exceptions/missing_tenant_context_exception'

class ProbeSchema extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare tenantId: string

  @column()
  declare ownerId: string

  @column()
  declare name: string
}

class Probe extends compose(ProbeSchema, withTenant) {
  static override table = 'tenancy_probes'
}

class ProbeOwner extends BaseModel {
  static override table = 'tenancy_probe_owners'

  @column({ isPrimary: true })
  declare id: string

  @hasMany(() => Probe, { foreignKey: 'ownerId' })
  declare probes: HasMany<typeof Probe>
}

/**
 * Two tenants with two probes each, all under one global owner. Postgres DDL
 * is transactional, so the global transaction drops the tables after each test.
 */
async function seed() {
  await db.rawQuery('CREATE TABLE tenancy_probe_owners (id uuid PRIMARY KEY DEFAULT uuidv7())')
  await db.rawQuery(`
    CREATE TABLE tenancy_probes (
      id uuid PRIMARY KEY DEFAULT uuidv7(),
      tenant_id uuid NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
      owner_id uuid NOT NULL REFERENCES tenancy_probe_owners (id),
      name text NOT NULL
    )
  `)

  const acme = await Tenant.create({ name: 'Acme' })
  const globex = await Tenant.create({ name: 'Globex' })
  const owner = await ProbeOwner.create({})

  const insert = async (tenant: Tenant, name: string) => {
    const [row] = await db
      .table<{ id: string }>('tenancy_probes')
      .insert({ tenant_id: tenant.id, owner_id: owner.id, name })
      .returning('id')

    if (row === undefined) throw new Error(`inserting ${name} returned no id`)

    return row.id
  }

  const acmeId = await insert(acme, 'probe 0')
  const acmeIds = [acmeId, await insert(acme, 'probe 1')]
  const globexId = await insert(globex, 'probe 2')
  const globexIds = [globexId, await insert(globex, 'probe 3')]

  return { acme, globex, ownerId: owner.id, acmeId, acmeIds, globexId, globexIds }
}

const namesOf = (tenant: Tenant) =>
  db
    .query<{ name: string }>()
    .from('tenancy_probes')
    .where('tenant_id', tenant.id)
    .orderBy('name')
    .select('name')

test.group('Tenancy | withTenant', group => {
  group.each.setup(() => testUtils.db().wrapInGlobalTransaction())

  test('reads only the current tenant rows', async ({ assert }) => {
    const { acme, acmeIds, globexId } = await seed()

    await runInTenant(acme.id, async () => {
      const all = await Probe.all()
      assert.sameMembers(
        all.map(probe => probe.id),
        acmeIds,
      )

      const pojos = await Probe.query().pojo<{ id: string }>()
      assert.sameMembers(
        pojos.map(probe => probe.id),
        acmeIds,
      )

      assert.isNull(await Probe.find(globexId))
      assert.isNull(await Probe.findBy('name', 'probe 2'))
    })
  })

  test('counts only the current tenant rows when paginating', async ({ assert }) => {
    const { acme } = await seed()

    const page = await runInTenant(acme.id, () => Probe.query().paginate(1, 10))

    assert.equal(page.total, 2)
    assert.lengthOf(page.all(), 2)
  })

  test('bulk updates only the current tenant rows', async ({ assert }) => {
    const { acme, globex } = await seed()

    await runInTenant(acme.id, async () => {
      await Probe.query().update({ name: 'renamed' })
    })

    assert.deepEqual(await namesOf(acme), [{ name: 'renamed' }, { name: 'renamed' }])
    assert.deepEqual(await namesOf(globex), [{ name: 'probe 2' }, { name: 'probe 3' }])
  })

  test('bulk deletes only the current tenant rows', async ({ assert }) => {
    const { acme, globex } = await seed()

    await runInTenant(acme.id, async () => {
      await Probe.query().delete()
    })

    assert.lengthOf(await namesOf(acme), 0)
    assert.lengthOf(await namesOf(globex), 2)
  })

  test('restricts relationship queries and preloads from a global model', async ({ assert }) => {
    const { acme, ownerId, acmeIds } = await seed()

    await runInTenant(acme.id, async () => {
      const owner = await ProbeOwner.query().where('id', ownerId).preload('probes').firstOrFail()
      assert.sameMembers(
        owner.probes.map(probe => probe.id),
        acmeIds,
      )

      const related = await owner.related('probes').query()
      assert.sameMembers(
        related.map(probe => probe.id),
        acmeIds,
      )

      assert.isNull(await owner.related('probes').query().where('name', 'probe 2').first())
      assert.equal((await owner.related('probes').query().paginate(1, 10)).total, 2)
    })
  })

  test('fills tenantId on create from the tenant context', async ({ assert }) => {
    const { acme, ownerId } = await seed()

    const probe = await runInTenant(acme.id, () => Probe.create({ ownerId, name: 'new' }))

    assert.equal(probe.tenantId, acme.id)
  })

  test('refuses to write a row into another tenant', async ({ assert }) => {
    const { acme, globex, acmeId, ownerId } = await seed()

    await runInTenant(acme.id, async () => {
      await assert.rejects(
        () => Probe.create({ ownerId, name: 'smuggled', tenantId: globex.id }),
        /into another tenant/,
      )

      const probe = await Probe.findOrFail(acmeId)
      await assert.rejects(() => probe.merge({ tenantId: globex.id }).save(), /into another tenant/)
    })

    assert.deepEqual(
      (await namesOf(globex)).map(row => row.name),
      ['probe 2', 'probe 3'],
    )
  })

  test('refuses to create without a tenantId in the system context', async ({ assert }) => {
    const { ownerId } = await seed()

    await assert.rejects(
      () => runAsSystem(() => Probe.create({ ownerId, name: 'orphan' })),
      /needs an explicit tenantId/,
    )
  })

  test('sees every tenant in the system context', async ({ assert }) => {
    const { acmeIds, globexIds } = await seed()

    const all = await runAsSystem(() => Probe.all())

    assert.sameMembers(
      all.map(probe => probe.id),
      [...acmeIds, ...globexIds],
    )
  })

  test('throws outside any tenant context', async ({ assert }) => {
    const { ownerId } = await seed()
    const owner = await ProbeOwner.findOrFail(ownerId)

    await assert.rejects(() => Probe.query().delete(), MissingTenantContextException)
    await assert.rejects(() => owner.related('probes').query(), MissingTenantContextException)
    await assert.rejects(() => Probe.create({ ownerId, name: 'x' }), MissingTenantContextException)
  })

  test('existsInTenant rejects an id of another tenant', async ({ assert }) => {
    const { acme, acmeId, globexId } = await seed()
    const validator = vine.create({ probeId: vine.string().exists(existsInTenant(Probe)) })

    await runInTenant(acme.id, async () => {
      await validator.validate({ probeId: acmeId })
      await assert.rejects(() => validator.validate({ probeId: globexId }))
    })
  })
})
