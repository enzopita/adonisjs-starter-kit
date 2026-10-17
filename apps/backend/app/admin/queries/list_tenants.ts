import Tenant from '#tenancy/models/tenant'

export interface ListTenantsInput {
  search?: string
  page: number
  perPage: number
}

export interface TenantRow {
  tenant: Tenant
  memberCount: number
}

/** Tenant and its memberships aren't tenant-scoped, so this reads every tenant without a context. */
export default class ListTenants {
  async handle({ search, page, perPage }: ListTenantsInput) {
    const tenants = await Tenant.query()
      .if(search, query => query.whereILike('name', `%${search}%`))
      .withCount('memberships')
      .orderBy('name')
      .orderBy('id')
      .paginate(page, perPage)

    const rows: TenantRow[] = tenants.all().map(tenant => ({
      tenant,
      memberCount: Number(tenant.$extras.memberships_count),
    }))

    return { rows, meta: tenants.getMeta() }
  }
}
