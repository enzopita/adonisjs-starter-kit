import router from '@adonisjs/core/services/router';

import { apiRoutes } from '#core/api_routes';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';
import {
  invitationAcceptThrottle,
  invitationsCreateThrottle,
} from '#start/limiter';

const {
  MyPermissions,
  PermissionCatalog,
  Roles,
  Members,
  MemberRoles,
  MemberPermissions,
  Invitations,
  InvitationAccept,
} = controllers.access;

apiRoutes(() => {
  router
    .group(() => {
      router.get('access/me', [MyPermissions, 'show']);
      router.get('access/permissions', [PermissionCatalog, 'show']);

      router.get('roles', [Roles, 'index']);
      router.post('roles', [Roles, 'store']);
      router.put('roles/:id', [Roles, 'update']);
      router.delete('roles/:id', [Roles, 'destroy']);

      router.get('members', [Members, 'index']);
      router
        .put('members/:userId/role', [MemberRoles, 'update'])
        .where('userId', router.matchers.uuid());
      router
        .put('members/:userId/permissions', [MemberPermissions, 'update'])
        .where('userId', router.matchers.uuid());

      router.get('invitations', [Invitations, 'index']);
      router
        .post('invitations', [Invitations, 'store'])
        .use(invitationsCreateThrottle);
      router.delete('invitations/:id', [Invitations, 'destroy']);
    })
    .as('access')
    .use([middleware.auth(), middleware.tenant()]);

  router
    .post('invitations/accept', [InvitationAccept, 'store'])
    .use([middleware.auth(), invitationAcceptThrottle]);
});
