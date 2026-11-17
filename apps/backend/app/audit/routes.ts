import router from '@adonisjs/core/services/router';

import { apiRoutes } from '#core/api_routes';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';

const { AuditEvents, AccountActivity } = controllers.audit;

apiRoutes(() => {
  router
    .group(() => {
      router.get('events', [AuditEvents, 'index']);
    })
    .prefix('audit')
    .as('audit')
    .use([middleware.auth(), middleware.tenant()]);

  router
    .get('account/activity', [AccountActivity, 'index'])
    .as('audit.account_activity.index')
    .use(middleware.auth());
});
