import { z } from 'zod'
import { queries } from '@/features/core/api'

const PER_PAGE = 20

/** A list page's search and page, as its URL holds them; a value that doesn't parse is dropped. */
export const adminSearchSchema = z.object({
  search: z.string().trim().min(1).max(255).optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
})

export type AdminSearch = z.infer<typeof adminSearchSchema>

export const adminMeQuery = () => queries.admin.me.show.queryOptions()

export const adminTenantsQuery = ({ search, page }: AdminSearch) =>
  queries.admin.tenants.index.queryOptions({ query: { search, page, perPage: PER_PAGE } })

export const adminTenantQuery = (id: string) =>
  queries.admin.tenants.show.queryOptions({ params: { id } })

export const adminUsersQuery = ({ search, page }: AdminSearch) =>
  queries.admin.users.index.queryOptions({ query: { search, page, perPage: PER_PAGE } })
