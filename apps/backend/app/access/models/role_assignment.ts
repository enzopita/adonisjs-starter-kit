import { compose } from '@adonisjs/core/helpers';

import { RoleAssignmentSchema } from '#database/schema';
import { withTenant } from '#tenancy/mixins/with_tenant';

export default class RoleAssignment extends compose(
  RoleAssignmentSchema,
  withTenant
) {}
