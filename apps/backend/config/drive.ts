import { defineConfig, services } from '@adonisjs/drive';

import env from '#start/env';

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  services: {
    /**
     * Points at rustfs (compose.yaml) in development. Path-style URLs
     * because a local endpoint has no per-bucket subdomains.
     */
    s3: services.s3({
      credentials: {
        accessKeyId: env.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env.get('AWS_SECRET_ACCESS_KEY').release(),
      },
      region: env.get('AWS_REGION'),
      endpoint: env.get('S3_ENDPOINT'),
      forcePathStyle: env.get('S3_FORCE_PATH_STYLE'),
      bucket: env.get('S3_BUCKET'),
      visibility: 'private',
    }),
  },
});

export default driveConfig;

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
