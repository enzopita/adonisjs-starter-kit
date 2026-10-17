import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { apiRoutes } from '#core/api_routes'
import { controllers } from '#generated/controllers'

const { Me, Tenants, TenantSuspensions, Users, UserSuspensions, Impersonations } = controllers.admin

apiRoutes(() => {
  router
    .group(() => {
      router.get('me', [Me, 'show'])

      router.get('tenants', [Tenants, 'index'])
      router.get('tenants/:id', [Tenants, 'show']).where('id', router.matchers.uuid())
      router.put('tenants/:id', [Tenants, 'update']).where('id', router.matchers.uuid())
      router
        .post('tenants/:id/suspension', [TenantSuspensions, 'store'])
        .where('id', router.matchers.uuid())
      router
        .delete('tenants/:id/suspension', [TenantSuspensions, 'destroy'])
        .where('id', router.matchers.uuid())

      router.get('users', [Users, 'index'])
      router
        .post('users/:id/suspension', [UserSuspensions, 'store'])
        .where('id', router.matchers.uuid())
      router
        .delete('users/:id/suspension', [UserSuspensions, 'destroy'])
        .where('id', router.matchers.uuid())
      router
        .post('users/:id/impersonation', [Impersonations, 'store'])
        .where('id', router.matchers.uuid())
    })
    .prefix('admin')
    .as('admin')
    .use(middleware.auth())
})
