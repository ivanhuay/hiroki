import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: true,
    external: ['hiroki', 'drizzle-orm'],
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: { only: false },
    splitting: false,
    sourcemap: true,
    external: ['hiroki', 'drizzle-orm'],
  },
]);
