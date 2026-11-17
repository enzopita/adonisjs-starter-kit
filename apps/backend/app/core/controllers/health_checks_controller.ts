import type { HttpContext } from '@adonisjs/core/http';

import { healthChecks } from '#start/health';

/**
 * @tags Health
 */
export default class HealthChecksController {
  /**
   * Check that the API is running
   *
   * Answers `200` as long as the process can serve requests. Checks no dependencies.
   */
  async live({ serialize }: HttpContext) {
    return await serialize({ status: 'ok' as const });
  }

  /**
   * Check that the API and its services are ready
   *
   * Send the monitoring secret in the `X-Monitoring-Secret` header. Runs every health check
   * (database, Redis, storage, disk and memory) and returns the report: `200` when all pass,
   * `503` with the same report when any fails.
   *
   * @response {401} The X-Monitoring-Secret header is missing or wrong
   */
  async ready({ response, serialize }: HttpContext) {
    const report = await healthChecks.run();

    if (!report.isHealthy) {
      return response.serviceUnavailable(await serialize(report));
    }

    return await serialize(report);
  }
}
