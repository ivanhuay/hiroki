/**
 * Smoke test — run after `npm run build` to verify package exports.
 * Usage: node smoke-test.mjs
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const expectedExports = [
  'default',
  'Hiroki',
  'MongooseAdapter',
  'AdapterRegistry',
  'adapterRegistry',
  'HttpError',
  'BadRequestError',
  'NotFoundError',
  'isHttpError',
  'hasStatus',
];

function checkAdapterRegistry(AdapterRegistry, errors) {
  const registry = new AdapterRegistry();
  if (typeof registry.register !== 'function' || typeof registry.resolve !== 'function') {
    errors.push('AdapterRegistry missing register/resolve methods');
  }
}

async function testESM(errors) {
  const pkg = await import('./dist/index.js');

  for (const name of expectedExports) {
    if (!(name in pkg)) errors.push(`[ESM] Missing export: ${name}`);
  }

  const hiroki = pkg.default;
  if (typeof hiroki.importModel !== 'function') errors.push('[ESM] default export missing importModel()');
  if (typeof hiroki.process !== 'function') errors.push('[ESM] default export missing process()');

  checkAdapterRegistry(pkg.AdapterRegistry, errors);
}

function testCJS(errors) {
  // require('hiroki') should return the singleton directly, not the exports object
  const hiroki = require('./dist/index.cjs');

  if (typeof hiroki.importModel !== 'function') errors.push('[CJS] require() missing importModel() — not returning singleton');
  if (typeof hiroki.process !== 'function') errors.push('[CJS] require() missing process() — not returning singleton');

  // Named exports must be accessible as properties on the singleton
  const namedExports = ['MongooseAdapter', 'AdapterRegistry', 'adapterRegistry', 'HttpError', 'BadRequestError', 'NotFoundError', 'isHttpError', 'hasStatus'];
  for (const name of namedExports) {
    if (!(name in hiroki)) errors.push(`[CJS] Missing named export: ${name}`);
  }

  checkAdapterRegistry(hiroki.AdapterRegistry, errors);
}

async function run() {
  const errors = [];

  await testESM(errors);
  testCJS(errors);

  if (errors.length) {
    console.error('SMOKE TEST FAILED:');
    errors.forEach(e => console.error(' -', e));
    process.exit(1);
  }

  console.log('Smoke test passed (ESM + CJS). Exports verified:', expectedExports.join(', '));
}

run();
