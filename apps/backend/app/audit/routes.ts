import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { apiRoutes } from '#core/api_routes'
import { controllers } from '#generated/controllers'

const { AuditEvents } = controllers.audit

apiRoutes(() => {
  router
    .group(() => {
      router.get('events', [AuditEvents, 'index'])
    })
    .prefix('audit')
    .as('audit')
    .use([middleware.auth(), middleware.tenant()])
})
