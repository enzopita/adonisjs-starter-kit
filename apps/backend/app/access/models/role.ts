import { compose } from '@adonisjs/core/helpers';

import { RoleSchema } from '#database/schema';
import { withTenant } from '#tenancy/mixins/with_tenant';

export default class Role extends compose(RoleSchema, withTenant) {}
