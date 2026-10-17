import { test } from '@japa/runner'
import env from '#start/env'

test.group('Core | health checks', () => {
  test('rejects a readiness probe without the monitoring secret', async ({ client }) => {
    const response = await client.get('/health/ready').header('x-monitoring-secret', 'wrong')

    response.assertStatus(401)
  })

  test('reports every indicator to a probe with the monitoring secret', async ({
    client,
    assert,
  }) => {
    const response = await client
      .get('/health/ready')
      .header('x-monitoring-secret', env.get('MONITORING_SECRET').release())

    // The checks measure this test process: after the full suite its RSS alone fails the memory
    // threshold, so the status reflects the machine, not the probe.
    assert.include([200, 503], response.status())
    assert.deepEqual(
      response.body().data.checks.map((check: { name: string }) => check.name),
      [
        'Disk space check',
        'Memory heap check',
        'Memory RSS check',
        'Database health check (pg)',
        'Connection count health check (pg)',
        'Storage check',
        'Redis health check (main)',
      ],
    )
  })
})
