import router from '@adonisjs/core/services/router';

import { apiRoutes } from '#core/api_routes';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';

const {
  Me,
  Tenants,
  TenantSuspensions,
  Users,
  UserSuspensions,
  Impersonations,
  PlatformAdmins,
  TwoFactorResets,
} = controllers.admin;

apiRoutes(() => {
  // The admin area's gate, outside the two-factor requirement: it tells a platform admin who
  // hasn't enabled two-factor yet that they must, rather than refusing them.
  router
    .group(() => {
      router.get('me', [Me, 'show']);
    })
    .prefix('admin')
    .as('admin')
    .use(middleware.auth());

  router
    .group(() => {
      router.get('tenants', [Tenants, 'index']);
      router.get('tenants/:id', [Tenants, 'show']);
      router.put('tenants/:id', [Tenants, 'update']);
      router.post('tenants/:id/suspension', [TenantSuspensions, 'store']);
      router.delete('tenants/:id/suspension', [TenantSuspensions, 'destroy']);

      router.get('users', [Users, 'index']);
      router.post('users/:id/suspension', [UserSuspensions, 'store']);
      router.delete('users/:id/suspension', [UserSuspensions, 'destroy']);
      router.post('users/:id/impersonation', [Impersonations, 'store']);
      router.delete('users/:id/two-factor', [TwoFactorResets, 'destroy']);
      router.post('users/:id/platform-admin', [PlatformAdmins, 'store']);
      router.delete('users/:id/platform-admin', [PlatformAdmins, 'destroy']);
    })
    .prefix('admin')
    .as('admin')
    .use([middleware.auth(), middleware.twoFactor()]);
});
