import { defineConfig } from 'tsup';

const external = ['mongoose', 'pluralize'];

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: true,
    external,
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: { only: false },
    splitting: false,
    sourcemap: true,
    external,
    footer: {
      // Make `require('hiroki')` return the default singleton directly,
      // with named exports (MongooseAdapter, HttpError, etc.) as properties.
      js: `
const _default = module.exports.default;
Object.assign(_default, module.exports);
module.exports = _default;
`,
    },
  },
]);
