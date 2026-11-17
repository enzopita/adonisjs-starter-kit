import router from '@adonisjs/core/services/router';

import { apiRoutes } from '#core/api_routes';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';

const { Tenants } = controllers.tenancy;

apiRoutes(() => {
  router
    .group(() => {
      router.get('/', [Tenants, 'index']);
      router.post('/', [Tenants, 'store']);
    })
    .prefix('tenants')
    .as('tenants')
    .use(middleware.auth());
});
