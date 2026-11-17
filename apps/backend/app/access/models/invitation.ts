import { compose } from '@adonisjs/core/helpers';

import { InvitationSchema } from '#database/schema';
import { withTenant } from '#tenancy/mixins/with_tenant';

export default class Invitation extends compose(InvitationSchema, withTenant) {}
