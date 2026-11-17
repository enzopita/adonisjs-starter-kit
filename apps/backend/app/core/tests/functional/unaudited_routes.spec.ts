import router from '@adonisjs/core/services/router';
import { test } from '@japa/runner';

// Regression: a route slips out of the audit guard unreviewed, or a person's action is marked as
// no person's action.
test.group('Core | unaudited routes', () => {
  test('lists every unaudited route, none behind auth or tenant', ({
    assert,
  }) => {
    const unaudited = Object.values(router.toJSON())
      .flat()
      .flatMap((route) => {
        const named = [...route.middleware.all()].flatMap((item) =>
          'name' in item && 'args' in item
            ? [{ name: item.name, args: item.args }]
            : []
        );

        const marker = named.find((item) => item.name === 'unaudited');

        if (!marker) {
          return [];
        }

        const guarded = named.some(
          (item) => item.name === 'auth' || item.name === 'tenant'
        );

        return [
          `${route.methods.join(',')} ${route.pattern} ${JSON.stringify(marker.args)}${guarded ? ' behind auth or tenant' : ''}`,
        ];
      });

    // One line per unaudited route: `METHOD /pattern {"reason":"..."}`.
    assert.deepEqual(unaudited, []);
  });
});
