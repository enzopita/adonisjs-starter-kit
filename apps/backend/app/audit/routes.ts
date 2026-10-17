import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { apiRoutes } from '#core/api_routes'
import { controllers } from '#generated/controllers'

const { AuditEvents, AccountActivity } = controllers.audit

apiRoutes(() => {
  router
    .group(() => {
      router.get('events', [AuditEvents, 'index'])
    })
    .prefix('audit')
    .as('audit')
    .use([middleware.auth(), middleware.tenant()])

  router
    .get('account/activity', [AccountActivity, 'index'])
    .as('audit.account_activity.index')
    .use(middleware.auth())
})
