import type { NormalizeConstructor } from '@adonisjs/core/types/helpers';
import type { BaseModel } from '@adonisjs/lucid/orm';
import {
  beforeCreate,
  beforeFetch,
  beforeFind,
  beforePaginate,
  beforeSave,
} from '@adonisjs/lucid/orm';
import type {
  LucidModel,
  ModelAdapterOptions,
  ModelQueryBuilderContract,
} from '@adonisjs/lucid/types/model';

import { currentTenantContext } from '#tenancy/tenant_context';

type Query = ModelQueryBuilderContract<LucidModel>;

function restrict<T extends LucidModel, Result>(
  query: ModelQueryBuilderContract<T, Result>
) {
  const context = currentTenantContext();

  if (context.kind === 'tenant')
    query.where(`${query.model.table}.tenant_id`, context.tenantId);
}

/**
 * Lucid builds relationship and preload queries without calling query(), so
 * those are restricted when they run; the rest already were in query().
 */
function restrictRelated(query: Query) {
  if ('isRelatedQuery' in query) restrict(query);
}

/**
 * Restricts every query of the model to the current tenant, and fills
 * `tenantId` on create. See "Tenancy" in docs/architecture.md.
 */
export function withTenant<
  Model extends NormalizeConstructor<typeof BaseModel> & {
    prototype: { tenantId: string };
  },
>(superclass: Model) {
  class WithTenant extends superclass {
    declare tenantId: string;

    static override query<T extends LucidModel, Result = InstanceType<T>>(
      this: T,
      options?: ModelAdapterOptions
    ): ModelQueryBuilderContract<T, Result> {
      const query = super.query<T, Result>(options);
      restrict(query);

      return query;
    }

    @beforeCreate()
    static fillTenantId(row: WithTenant) {
      if (row.tenantId) return;

      const context = currentTenantContext();

      if (context.kind === 'system') {
        throw new Error(
          `${row.constructor.name} needs an explicit tenantId when created in runAsSystem()`
        );
      }

      row.tenantId = context.tenantId;
    }

    /** A tenantId from user input (merge, fill) must not move a row into another tenant. */
    @beforeSave()
    static guardTenantId(row: WithTenant) {
      const context = currentTenantContext();

      if (
        context.kind === 'tenant' &&
        row.$dirty.tenantId &&
        row.tenantId !== context.tenantId
      ) {
        throw new Error(
          `${row.constructor.name} can't be saved into another tenant`
        );
      }
    }

    @beforeFind()
    @beforeFetch()
    static restrictRelatedFetch(query: Query) {
      restrictRelated(query);
    }

    /** The rows query of a paginate also runs before:fetch; only its count query needs it here. */
    @beforePaginate()
    static restrictRelatedCount([countQuery]: [Query, Query]) {
      restrictRelated(countQuery);
    }
  }

  return WithTenant;
}
