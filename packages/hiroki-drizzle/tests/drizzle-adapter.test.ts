import { DrizzleAdapter } from '../src/drizzle-adapter';
import type { HirokiQuery } from 'hiroki';

const mockDb = {};
const mockTable = {};

function makeAdapter(name = 'TestModel') {
  return new DrizzleAdapter(name, { db: mockDb, table: mockTable });
}

describe('DrizzleAdapter', () => {
  describe('identity', () => {
    it('sets modelName from constructor', () => {
      expect(makeAdapter('User').modelName).toBe('User');
    });

    it('canHandle returns true for matching modelName', () => {
      expect(makeAdapter('User').canHandle('User')).toBe(true);
    });

    it('canHandle returns false for different name', () => {
      expect(makeAdapter('User').canHandle('Post')).toBe(false);
    });

    it('canHandle returns false for non-string', () => {
      expect(makeAdapter('User').canHandle(null)).toBe(false);
    });
  });

  describe('setLogger', () => {
    it('accepts a logger without throwing', () => {
      const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
      expect(() => makeAdapter().setLogger(logger)).not.toThrow();
    });
  });

  describe('unimplemented methods reject with "not implemented"', () => {
    let adapter: DrizzleAdapter;

    beforeEach(() => {
      adapter = makeAdapter();
    });

    it('findById', async () => {
      await expect(adapter.findById('1')).rejects.toThrow('not implemented');
    });

    it('find', async () => {
      await expect(adapter.find({} as HirokiQuery)).rejects.toThrow('not implemented');
    });

    it('count', async () => {
      await expect(adapter.count()).rejects.toThrow('not implemented');
    });

    it('distinct', async () => {
      await expect(adapter.distinct('field')).rejects.toThrow('not implemented');
    });

    it('create', async () => {
      await expect(adapter.create({ name: 'test' })).rejects.toThrow('not implemented');
    });

    it('updateById', async () => {
      await expect(adapter.updateById('1', { name: 'test' })).rejects.toThrow('not implemented');
    });

    it('updateByConditions', async () => {
      await expect(adapter.updateByConditions({}, { name: 'test' })).rejects.toThrow('not implemented');
    });

    it('delete', async () => {
      await expect(adapter.delete('1')).rejects.toThrow('not implemented');
    });
  });

  describe('logger integration', () => {
    it('calls logger.debug on findById when logger set', async () => {
      const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
      const adapter = makeAdapter('User');
      adapter.setLogger(logger);

      await adapter.findById('1').catch(() => {});

      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('findById'));
    });

    it('calls logger.debug on create when logger set', async () => {
      const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
      const adapter = makeAdapter('User');
      adapter.setLogger(logger);

      await adapter.create({}).catch(() => {});

      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('create'));
    });
  });
});
