import Controller from '../src/controller';
import hiroki from '../src';
import { DisabledMethodError } from '../src/errors';
import Users from './mock/models/users';
import Books from './mock/models/books';

// Exposes protected _getQueryParams for unit testing
class TestableController extends Controller {
  public parseQueryParams(path: string) {
    return this._getQueryParams(path);
  }
}

describe('Controller', () => {
  let controller: TestableController;

  beforeEach(() => {
    controller = new TestableController(Users, { basePath: '/api' });
  });

  // ─── routing: check() ───────────────────────────────────────────────────────

  describe('check()', () => {
    it('matches own model path', () => {
      expect(controller.check('/api/users')).toBe(true);
    });

    it('matches path with id segment', () => {
      expect(controller.check('/api/users/507f1f77bcf86cd799439011')).toBe(true);
    });

    it('matches path with query string', () => {
      expect(controller.check('/api/users?count=true')).toBe(true);
    });

    it('does not match unrelated model path', () => {
      expect(controller.check('/api/books')).toBe(false);
    });

    it('does not match base path without model segment', () => {
      expect(controller.check('/api')).toBe(false);
    });

    it('does not match different base path', () => {
      expect(controller.check('/other/users')).toBe(false);
    });

    it('respects basePath in path matching', () => {
      const c = new TestableController(Books, { basePath: '/v1' });
      expect(c.check('/v1/books')).toBe(true);
      expect(c.check('/api/books')).toBe(false);
    });

    it('uses non-pluralized route when disabledPluralize is false', () => {
      const c = new TestableController(Users, {
        basePath: '/api',
        disabledPluralize: false
      });
      expect(c.check('/api/Users')).toBe(true);
      expect(c.check('/api/users')).toBe(false);
    });

    it('exposes correct path and routeName', () => {
      expect(controller.path).toBe('/api/users');
      expect(controller.routeName).toBe('users');
    });
  });

  // ─── query parsing: _getQueryParams() ───────────────────────────────────────

  describe('_getQueryParams()', () => {
    it('returns empty query for plain path', () => {
      const { query } = controller.parseQueryParams('/api/users');
      expect(query).toEqual({});
    });

    it('extracts id from path segment', () => {
      const { query } = controller.parseQueryParams('/api/users/abc123');
      expect(query.id).toBe('abc123');
    });

    it('extracts id with ObjectId format', () => {
      const { query } = controller.parseQueryParams('/api/users/507f1f77bcf86cd799439011');
      expect(query.id).toBe('507f1f77bcf86cd799439011');
    });

    it('parses string query params', () => {
      const { query } = controller.parseQueryParams('/api/users?limit=10&skip=5');
      expect(query.limit).toBe('10');
      expect(query.skip).toBe('5');
    });

    it('coerces "true" string to boolean', () => {
      const { query } = controller.parseQueryParams('/api/users?count=true');
      expect(query.count).toBe(true);
    });

    it('coerces "false" string to boolean', () => {
      const { query } = controller.parseQueryParams('/api/users?fast=false');
      expect(query.fast).toBe(false);
    });

    it('parses single conditions bracket param', () => {
      const { query } = controller.parseQueryParams('/api/users?conditions[name]=john');
      expect(query.conditions).toEqual({ name: 'john' });
    });

    it('parses multiple conditions bracket params', () => {
      const { query } = controller.parseQueryParams(
        '/api/users?conditions[name]=john&conditions[role]=admin'
      );
      expect(query.conditions).toEqual({ name: 'john', role: 'admin' });
    });

    it('combines id extraction with query params', () => {
      const { query } = controller.parseQueryParams('/api/users/abc123?select=name');
      expect(query.id).toBe('abc123');
      expect(query.select).toBe('name');
    });

    it('handles populate query param', () => {
      const { query } = controller.parseQueryParams('/api/users?populate=books');
      expect(query.populate).toBe('books');
    });

    it('handles sort query param', () => {
      const { query } = controller.parseQueryParams('/api/users?sort=name');
      expect(query.sort).toBe('name');
    });
  });

  // ─── disabled methods ────────────────────────────────────────────────────────

  describe('disabled methods', () => {
    // process() throws synchronously before returning a Promise when method is disabled
    describe('via process() — uppercase method names in config', () => {
      it('throws DisabledMethodError for disabled DELETE', () => {
        const c = new TestableController(Users, {
          basePath: '/api',
          disabledMethod: ['DELETE']
        });
        expect(() => c.process('/api/users/123', { method: 'DELETE' })).toThrow(DisabledMethodError);
      });

      it('throws DisabledMethodError for disabled GET', () => {
        const c = new TestableController(Users, {
          basePath: '/api',
          disabledMethod: ['GET']
        });
        expect(() => c.process('/api/users', { method: 'GET' })).toThrow(DisabledMethodError);
      });

      it('throws DisabledMethodError for disabled POST', () => {
        const c = new TestableController(Users, {
          basePath: '/api',
          disabledMethod: ['POST']
        });
        expect(() =>
          c.process('/api/users', { method: 'POST', body: { name: 'test' } })
        ).toThrow(DisabledMethodError);
      });

      it('throws DisabledMethodError for disabled PUT', () => {
        const c = new TestableController(Users, {
          basePath: '/api',
          disabledMethod: ['PUT']
        });
        expect(() =>
          c.process('/api/users/123', { method: 'PUT', body: { name: 'test' } })
        ).toThrow(DisabledMethodError);
      });

      it('does not affect non-disabled methods', () => {
        const c = new TestableController(Users, {
          basePath: '/api',
          disabledMethod: ['DELETE']
        });
        // GET is not disabled — process() returns a Promise without throwing
        expect(() => c.process('/api/users', { method: 'GET' })).not.toThrow();
      });

      it('can disable multiple methods simultaneously', () => {
        const c = new TestableController(Users, {
          basePath: '/api',
          disabledMethod: ['DELETE', 'POST']
        });
        expect(() =>
          c.process('/api/users', { method: 'POST', body: { name: 'test' } })
        ).toThrow(DisabledMethodError);
        expect(() =>
          c.process('/api/users/123', { method: 'DELETE' })
        ).toThrow(DisabledMethodError);
      });
    });

    describe('via direct method calls — lowercase method names in config', () => {
      it('throws DisabledMethodError for lowercase disabled delete', () => {
        const c = new TestableController(Users, {
          basePath: '/api',
          disabledMethod: ['delete']
        });
        expect(() => c.delete({ id: '123' })).toThrow(DisabledMethodError);
      });

      it('throws DisabledMethodError for lowercase disabled get', () => {
        const c = new TestableController(Users, {
          basePath: '/api',
          disabledMethod: ['get']
        });
        expect(() => c.get({ id: '123' })).toThrow(DisabledMethodError);
      });

      it('throws DisabledMethodError for lowercase disabled post', () => {
        const c = new TestableController(Users, {
          basePath: '/api',
          disabledMethod: ['post']
        });
        expect(() => c.post({ body: { name: 'test' } })).toThrow(DisabledMethodError);
      });

      it('throws DisabledMethodError for lowercase disabled put', () => {
        const c = new TestableController(Users, {
          basePath: '/api',
          disabledMethod: ['put']
        });
        expect(() => c.put({ query: { id: '123' }, body: { name: 'test' } })).toThrow(
          DisabledMethodError
        );
      });
    });
  });
});

// ─── Hiroki coverage extras ───────────────────────────────────────────────────

describe('Hiroki class', () => {
  it('importModels accepts an array of models', () => {
    hiroki.importModels([Users, Books]);
    expect(hiroki.controllers['Users']).toBeDefined();
    expect(hiroki.controllers['Books']).toBeDefined();
  });

  it('importModels accepts a record of models', () => {
    hiroki.importModels({ Users, Books });
    expect(hiroki.controllers['Users']).toBeDefined();
    expect(hiroki.controllers['Books']).toBeDefined();
  });

  it('setConfig updates config logLevel', () => {
    hiroki.setConfig({ logLevel: 'debug' });
    expect(hiroki.config.logLevel).toBe('debug');
  });

  it('setConfig uses custom logger when provided', () => {
    const customLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
    hiroki.setConfig({ logger: customLogger });
    expect(hiroki.config.logger).toBe(customLogger);
  });
});
