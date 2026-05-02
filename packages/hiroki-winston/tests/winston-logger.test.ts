import { WinstonLogger } from '../src/winston-logger';

function makeMockWinston() {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
}

describe('WinstonLogger', () => {
  describe('method delegation', () => {
    it('info delegates to winston.info with message', () => {
      const winston = makeMockWinston();
      const logger = new WinstonLogger(winston);
      logger.info('hello info');
      expect(winston.info).toHaveBeenCalledWith('hello info');
    });

    it('error delegates to winston.error with message', () => {
      const winston = makeMockWinston();
      const logger = new WinstonLogger(winston);
      logger.error('something failed');
      expect(winston.error).toHaveBeenCalledWith('something failed');
    });

    it('warn delegates to winston.warn with message', () => {
      const winston = makeMockWinston();
      const logger = new WinstonLogger(winston);
      logger.warn('watch out');
      expect(winston.warn).toHaveBeenCalledWith('watch out');
    });

    it('debug delegates to winston.debug with message', () => {
      const winston = makeMockWinston();
      const logger = new WinstonLogger(winston);
      logger.debug('debug msg');
      expect(winston.debug).toHaveBeenCalledWith('debug msg');
    });
  });

  describe('isolation', () => {
    it('info does not call other winston methods', () => {
      const winston = makeMockWinston();
      const logger = new WinstonLogger(winston);
      logger.info('msg');
      expect(winston.error).not.toHaveBeenCalled();
      expect(winston.warn).not.toHaveBeenCalled();
      expect(winston.debug).not.toHaveBeenCalled();
    });

    it('error does not call other winston methods', () => {
      const winston = makeMockWinston();
      const logger = new WinstonLogger(winston);
      logger.error('msg');
      expect(winston.info).not.toHaveBeenCalled();
      expect(winston.warn).not.toHaveBeenCalled();
      expect(winston.debug).not.toHaveBeenCalled();
    });
  });

  describe('passes exact message string', () => {
    it('preserves empty string', () => {
      const winston = makeMockWinston();
      const logger = new WinstonLogger(winston);
      logger.info('');
      expect(winston.info).toHaveBeenCalledWith('');
    });

    it('preserves message with special chars', () => {
      const winston = makeMockWinston();
      const logger = new WinstonLogger(winston);
      const msg = '[WARN] Rate limit hit: user=xyz-456';
      logger.warn(msg);
      expect(winston.warn).toHaveBeenCalledWith(msg);
    });
  });
});
