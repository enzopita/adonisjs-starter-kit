import type { SimplePaginatorContract } from '@adonisjs/lucid/types/querybuilder'

/** What Lucid's `getMeta()` returns with the camelCase naming strategy, which types it `any`. */
export function paginationMeta<Row>(paginator: SimplePaginatorContract<Row>) {
  return {
    total: paginator.total,
    perPage: paginator.perPage,
    currentPage: paginator.currentPage,
    lastPage: paginator.lastPage,
    firstPage: paginator.firstPage,
    firstPageUrl: paginator.getUrl(1),
    lastPageUrl: paginator.getUrl(paginator.lastPage),
    nextPageUrl: paginator.getNextPageUrl(),
    previousPageUrl: paginator.getPreviousPageUrl(),
  }
}
