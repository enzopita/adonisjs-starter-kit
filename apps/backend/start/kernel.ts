import router from '@adonisjs/core/services/router';
import server from '@adonisjs/core/services/server';

server.errorHandler(() => import('#core/exceptions/handler'));

server.use([
  () => import('#core/middleware/force_json_response_middleware'),
  () => import('#core/middleware/container_bindings_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
]);

router.use([
  () => import('#core/middleware/detect_user_locale_middleware'),
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/shield/shield_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
  () => import('#auth/middleware/silent_auth_middleware'),
  () => import('#core/middleware/audit_scope_middleware'),
  () => import('#access/middleware/initialize_bouncer_middleware'),
]);

export const middleware = router.named({
  auth: () => import('#auth/middleware/auth_middleware'),
  tenant: () => import('#tenancy/middleware/tenant_middleware'),
  twoFactor: () => import('#admin/middleware/require_two_factor_middleware'),
  unaudited: () => import('#core/middleware/unaudited_middleware'),
});
