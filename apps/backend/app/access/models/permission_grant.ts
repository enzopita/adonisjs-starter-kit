import { compose } from '@adonisjs/core/helpers';

import { PermissionGrantSchema } from '#database/schema';
import { withTenant } from '#tenancy/mixins/with_tenant';

export default class PermissionGrant extends compose(
  PermissionGrantSchema,
  withTenant
) {}
