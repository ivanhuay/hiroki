import { parseHirokiQuery } from '../src/query';

function params(str: string): URLSearchParams {
  return new URLSearchParams(str);
}

describe('parseHirokiQuery', () => {
  describe('empty / no-op', () => {
    it('returns empty object for empty params', () => {
      expect(parseHirokiQuery(params(''))).toEqual({});
    });

    it('ignores unknown params', () => {
      expect(parseHirokiQuery(params('foo=bar&baz=1'))).toEqual({});
    });
  });

  describe('pagination', () => {
    it('parses limit', () => {
      expect(parseHirokiQuery(params('limit=10')).limit).toBe(10);
    });

    it('parses offset', () => {
      expect(parseHirokiQuery(params('offset=5')).offset).toBe(5);
    });

    it('parses skip as offset alias', () => {
      expect(parseHirokiQuery(params('skip=20')).offset).toBe(20);
    });

    it('coerces limit to number', () => {
      expect(typeof parseHirokiQuery(params('limit=3')).limit).toBe('number');
    });
  });

  describe('select', () => {
    it('parses single field', () => {
      expect(parseHirokiQuery(params('select=name')).select).toEqual(['name']);
    });

    it('parses comma-separated fields', () => {
      expect(parseHirokiQuery(params('select=name,email,age')).select).toEqual(['name', 'email', 'age']);
    });
  });

  describe('sort', () => {
    it('parses asc sort', () => {
      expect(parseHirokiQuery(params('sort=name')).sort).toEqual([{ field: 'name', dir: 'asc' }]);
    });

    it('parses desc sort with dash prefix', () => {
      expect(parseHirokiQuery(params('sort=-name')).sort).toEqual([{ field: 'name', dir: 'desc' }]);
    });

    it('parses multi-field sort', () => {
      expect(parseHirokiQuery(params('sort=-name,age')).sort).toEqual([
        { field: 'name', dir: 'desc' },
        { field: 'age', dir: 'asc' },
      ]);
    });
  });

  describe('populate', () => {
    it('parses string path', () => {
      expect(parseHirokiQuery(params('populate=books')).populate).toBe('books');
    });
  });

  describe('where filters', () => {
    it('eq: bare value', () => {
      expect(parseHirokiQuery(params('where[name]=john')).where).toEqual([
        { field: 'name', op: 'eq', value: 'john' },
      ]);
    });

    it('eq: explicit $eq operator', () => {
      expect(parseHirokiQuery(params('where[age][$eq]=18')).where).toEqual([
        { field: 'age', op: 'eq', value: 18 },
      ]);
    });

    it('gt operator', () => {
      expect(parseHirokiQuery(params('where[age][$gt]=18')).where).toEqual([
        { field: 'age', op: 'gt', value: 18 },
      ]);
    });

    it('gte operator', () => {
      expect(parseHirokiQuery(params('where[age][$gte]=18')).where).toEqual([
        { field: 'age', op: 'gte', value: 18 },
      ]);
    });

    it('lt operator', () => {
      expect(parseHirokiQuery(params('where[age][$lt]=65')).where).toEqual([
        { field: 'age', op: 'lt', value: 65 },
      ]);
    });

    it('lte operator', () => {
      expect(parseHirokiQuery(params('where[age][$lte]=65')).where).toEqual([
        { field: 'age', op: 'lte', value: 65 },
      ]);
    });

    it('ne operator', () => {
      expect(parseHirokiQuery(params('where[status][$ne]=deleted')).where).toEqual([
        { field: 'status', op: 'ne', value: 'deleted' },
      ]);
    });

    it('regex operator', () => {
      expect(parseHirokiQuery(params('where[name][$regex]=^john')).where).toEqual([
        { field: 'name', op: 'regex', value: '^john' },
      ]);
    });

    it('in: splits comma-separated values', () => {
      expect(parseHirokiQuery(params('where[role][$in]=admin,user')).where).toEqual([
        { field: 'role', op: 'in', value: ['admin', 'user'] },
      ]);
    });

    it('nin: splits comma-separated values', () => {
      expect(parseHirokiQuery(params('where[status][$nin]=deleted,banned')).where).toEqual([
        { field: 'status', op: 'nin', value: ['deleted', 'banned'] },
      ]);
    });

    it('in: coerces numeric values in array', () => {
      const [filter] = parseHirokiQuery(params('where[age][$in]=18,21,25')).where!;
      expect(filter.value).toEqual([18, 21, 25]);
    });

    it('multiple where filters accumulate', () => {
      const q = parseHirokiQuery(params('where[name]=john&where[age][$gt]=18'));
      expect(q.where).toHaveLength(2);
    });

    it('unknown op falls back to eq', () => {
      const [filter] = parseHirokiQuery(params('where[x][$unknown]=v')).where!;
      expect(filter.op).toBe('eq');
    });
  });

  describe('value coercion in where', () => {
    it('coerces "true" string to boolean', () => {
      const [f] = parseHirokiQuery(params('where[active]=true')).where!;
      expect(f.value).toBe(true);
    });

    it('coerces "false" string to boolean', () => {
      const [f] = parseHirokiQuery(params('where[active]=false')).where!;
      expect(f.value).toBe(false);
    });

    it('coerces numeric string to number', () => {
      const [f] = parseHirokiQuery(params('where[age][$gt]=18')).where!;
      expect(f.value).toBe(18);
    });

    it('keeps plain string as string', () => {
      const [f] = parseHirokiQuery(params('where[name]=alice')).where!;
      expect(f.value).toBe('alice');
    });
  });

  describe('legacy conditions', () => {
    it('parses conditions JSON string', () => {
      const q = parseHirokiQuery(params('conditions={"name":"john"}'));
      expect(q.conditions).toBe('{"name":"john"}');
    });

    it('parses conditions bracket notation', () => {
      const q = parseHirokiQuery(params('conditions[name]=john'));
      expect(q.conditions).toEqual({ name: 'john' });
    });

    it('merges multiple bracket conditions', () => {
      const q = parseHirokiQuery(params('conditions[name]=john&conditions[role]=admin'));
      expect(q.conditions).toEqual({ name: 'john', role: 'admin' });
    });

    it('bracket conditions coerce values', () => {
      const q = parseHirokiQuery(params('conditions[age]=25')) as { conditions: Record<string, unknown> };
      expect((q.conditions as Record<string, unknown>).age).toBe(25);
    });
  });

  describe('security: dangerous field names', () => {
    it('drops __proto__ in where filter', () => {
      const q = parseHirokiQuery(params('where[__proto__]=bad'));
      expect(q.where).toBeUndefined();
    });

    it('drops constructor in where filter', () => {
      const q = parseHirokiQuery(params('where[constructor]=bad'));
      expect(q.where).toBeUndefined();
    });

    it('drops prototype in where filter', () => {
      const q = parseHirokiQuery(params('where[prototype]=bad'));
      expect(q.where).toBeUndefined();
    });

    it('drops __proto__ in conditions bracket', () => {
      const q = parseHirokiQuery(params('conditions[__proto__]=bad'));
      expect(q.conditions).toBeUndefined();
    });

    it('keeps safe fields alongside filtered dangerous ones', () => {
      const q = parseHirokiQuery(params('where[name]=alice&where[__proto__]=bad'));
      expect(q.where).toEqual([{ field: 'name', op: 'eq', value: 'alice' }]);
    });
  });

  describe('combined params', () => {
    it('handles limit + sort + where together', () => {
      const q = parseHirokiQuery(params('limit=5&sort=-name&where[active]=true'));
      expect(q.limit).toBe(5);
      expect(q.sort).toEqual([{ field: 'name', dir: 'desc' }]);
      expect(q.where).toEqual([{ field: 'active', op: 'eq', value: true }]);
    });

    it('handles select + populate together', () => {
      const q = parseHirokiQuery(params('select=name,email&populate=books'));
      expect(q.select).toEqual(['name', 'email']);
      expect(q.populate).toBe('books');
    });
  });
});
