import { Env } from '@adonisjs/core/env';

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_NAME: Env.schema.string(),
  APP_KEY: Env.schema.secret(),
  FRONTEND_URL: Env.schema.string({ format: 'url', tld: false }),
  MONITORING_SECRET: Env.schema.secret(),
  // @adonisjs/cors compares origins with ===, so 'https://a.com, https://b.com/' would only allow a.
  CORS_ORIGIN: (key: string, value?: string) => {
    if (value === undefined || value === '') return undefined;

    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        if (!URL.canParse(entry)) {
          throw new Error(
            `Invalid value for "${key}": "${entry}" is not an origin URL`
          );
        }

        return new URL(entry).origin;
      });
  },
  // At least a day: 0 or less would delete the whole audit trail on the next prune.
  AUDIT_RETENTION_DAYS: (key: string, value?: string) => {
    if (value === undefined || value === '') return undefined;

    const days = Number(value);

    if (!Number.isInteger(days) || days < 1) {
      throw new Error(
        `Invalid value for "${key}": expected a whole number of days, 1 or more`
      );
    }

    return days;
  },

  // Database
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  // Mail
  MAIL_MAILER: Env.schema.enum(['smtp'] as const),
  MAIL_FROM_NAME: Env.schema.string(),
  MAIL_FROM_ADDRESS: Env.schema.string({ format: 'email' }),
  SMTP_HOST: Env.schema.string({ format: 'host' }),
  SMTP_PORT: Env.schema.number(),

  // Drive
  DRIVE_DISK: Env.schema.enum(['s3'] as const),
  AWS_ACCESS_KEY_ID: Env.schema.string(),
  AWS_SECRET_ACCESS_KEY: Env.schema.secret(),
  AWS_REGION: Env.schema.string(),
  S3_BUCKET: Env.schema.string(),
  S3_ENDPOINT: Env.schema.string.optional({ format: 'url', tld: false }),
  S3_FORCE_PATH_STYLE: Env.schema.boolean.optional(),

  // Redis
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.secret.optional(),

  // Queue
  QUEUE_DRIVER: Env.schema.enum(['redis', 'sync'] as const),

  // Limiter
  LIMITER_STORE: Env.schema.enum(['redis', 'memory'] as const),
});
