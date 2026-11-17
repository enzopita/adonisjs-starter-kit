import { defineConfig, drivers } from '@adonisjs/core/encryption';

import env from '#start/env';

const encryptionConfig = defineConfig({
  default: 'gcm',

  list: {
    gcm: drivers.aes256gcm({
      keys: [env.get('APP_KEY')],
      id: 'gcm',
    }),
  },
});

export default encryptionConfig;

declare module '@adonisjs/core/types' {
  export interface EncryptorsList extends InferEncryptors<
    typeof encryptionConfig
  > {}
}
