import { HttpContext } from '@adonisjs/core/http';
import { BaseSerializer } from '@adonisjs/core/transformers';

/**
 * What Lucid's paginator getMeta() returns. The serializer's own type guard declares every field a
 * string, but the counts are numbers and the neighbouring page URLs are null at either end.
 */
type PaginationMetaData = {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
  firstPageUrl: string;
  lastPageUrl: string;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
};

class ApiSerializer extends BaseSerializer<{
  Wrap: 'data';
  PaginationMetaData: PaginationMetaData;
}> {
  wrap = 'data' as const;

  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- BaseSerializer passes the metadata as unknown; the guard below parses it.
  definePaginationMetaData(metaData: unknown): PaginationMetaData {
    if (!this.isLucidPaginatorMetaData(metaData)) {
      throw new Error(
        'Invalid pagination metadata. Expected metadata to contain Lucid pagination keys'
      );
    }

    return {
      total: Number(metaData.total),
      perPage: Number(metaData.perPage),
      currentPage: Number(metaData.currentPage),
      lastPage: Number(metaData.lastPage),
      firstPage: Number(metaData.firstPage),
      firstPageUrl: metaData.firstPageUrl,
      lastPageUrl: metaData.lastPageUrl,
      nextPageUrl: metaData.nextPageUrl || null,
      previousPageUrl: metaData.previousPageUrl || null,
    };
  }
}

const serializer = new ApiSerializer();

// SAFETY: both functions forward their arguments unchanged to the serializer methods they are typed as.
const serialize = Object.assign(
  function (
    this: HttpContext,
    ...[data, resolver]: Parameters<ApiSerializer['serialize']>
  ) {
    return serializer.serialize(data, resolver ?? this.containerResolver);
  },
  {
    withoutWrapping(
      this: HttpContext,
      ...[data, resolver]: Parameters<ApiSerializer['serializeWithoutWrapping']>
    ) {
      return serializer.serializeWithoutWrapping(
        data,
        resolver ?? this.containerResolver
      );
    },
  }
) as ApiSerializer['serialize'] & {
  withoutWrapping: ApiSerializer['serializeWithoutWrapping'];
};

HttpContext.instanceProperty('serialize', serialize);

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    serialize: typeof serialize;
  }
}
