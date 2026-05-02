import { PinoLogger } from '../src/pino-logger';

function makeMockPino() {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
}

describe('PinoLogger', () => {
  describe('method delegation', () => {
    it('info delegates to pino.info with message', () => {
      const pino = makeMockPino();
      const logger = new PinoLogger(pino);
      logger.info('hello info');
      expect(pino.info).toHaveBeenCalledWith('hello info');
    });

    it('error delegates to pino.error with message', () => {
      const pino = makeMockPino();
      const logger = new PinoLogger(pino);
      logger.error('something failed');
      expect(pino.error).toHaveBeenCalledWith('something failed');
    });

    it('warn delegates to pino.warn with message', () => {
      const pino = makeMockPino();
      const logger = new PinoLogger(pino);
      logger.warn('watch out');
      expect(pino.warn).toHaveBeenCalledWith('watch out');
    });

    it('debug delegates to pino.debug with message', () => {
      const pino = makeMockPino();
      const logger = new PinoLogger(pino);
      logger.debug('debug msg');
      expect(pino.debug).toHaveBeenCalledWith('debug msg');
    });
  });

  describe('isolation', () => {
    it('info does not call other pino methods', () => {
      const pino = makeMockPino();
      const logger = new PinoLogger(pino);
      logger.info('msg');
      expect(pino.error).not.toHaveBeenCalled();
      expect(pino.warn).not.toHaveBeenCalled();
      expect(pino.debug).not.toHaveBeenCalled();
    });

    it('error does not call other pino methods', () => {
      const pino = makeMockPino();
      const logger = new PinoLogger(pino);
      logger.error('msg');
      expect(pino.info).not.toHaveBeenCalled();
      expect(pino.warn).not.toHaveBeenCalled();
      expect(pino.debug).not.toHaveBeenCalled();
    });
  });

  describe('passes exact message string', () => {
    it('preserves empty string', () => {
      const pino = makeMockPino();
      const logger = new PinoLogger(pino);
      logger.info('');
      expect(pino.info).toHaveBeenCalledWith('');
    });

    it('preserves message with special chars', () => {
      const pino = makeMockPino();
      const logger = new PinoLogger(pino);
      const msg = '[ERROR] Something went wrong: id=abc-123';
      logger.error(msg);
      expect(pino.error).toHaveBeenCalledWith(msg);
    });
  });
});
