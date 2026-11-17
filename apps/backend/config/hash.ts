import { defineConfig, drivers } from '@adonisjs/core/hash';

const hashConfig = defineConfig({
  default: 'scrypt',

  list: {
    scrypt: drivers.scrypt({}),
  },
});

export default hashConfig;

declare module '@adonisjs/core/types' {
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}
