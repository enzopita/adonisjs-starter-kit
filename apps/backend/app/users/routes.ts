import router from '@adonisjs/core/services/router';

import { apiRoutes } from '#core/api_routes';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';

const { Profile, Avatar } = controllers.users;

apiRoutes(() => {
  router
    .group(() => {
      router.get('profile', [Profile, 'show']);
      router.patch('profile', [Profile, 'update']);
      router.put('avatar', [Avatar, 'update']);
    })
    .prefix('account')
    .as('profile')
    .use(middleware.auth());
});
