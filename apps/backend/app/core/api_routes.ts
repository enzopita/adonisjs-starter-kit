import router from '@adonisjs/core/services/router';

/**
 * Each module's routes.ts is a separate preload, so none of them can share a
 * group defined elsewhere: they mount under the API prefix through this helper.
 */
export function apiRoutes(callback: () => void) {
  return router.group(callback).prefix('/api/v1');
}
