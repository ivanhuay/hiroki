import Controller, { ControllerConfig, ProcessParams } from './controller';
import { RouteNotFoundError, isHttpError, HttpErrorResponse } from './errors';
import { validateModel } from './validator';
import type { ValidModel } from './validator';
import { ConsoleLogger, HirokiLogger, LogLevel } from './logger';

export interface HirokiConfig {
  basePath?: string;
  logger?: HirokiLogger;
  logLevel?: LogLevel;
}

export interface ImportModelOptions extends ControllerConfig {}

export interface ProcessRequest extends ProcessParams {}

export interface ProcessResponse {
  error?: string;
  status?: number;
  code?: string;
  details?: unknown;
  [key: string]: unknown;
}

let instance: Hiroki | null = null;

class Hiroki {
  private defaultConfig: HirokiConfig;
  public config: HirokiConfig;
  public controllers: Record<string, Controller>;
  private logger: HirokiLogger;

  constructor() {
    if (instance) {
      return instance;
    }

    this.defaultConfig = {
      basePath: '/api',
      logLevel: 'error',
      logger: new ConsoleLogger({ logLevel: 'error' })
    };

    this.config = { ...this.defaultConfig };
    this.controllers = {};
    this.logger = this.config.logger || new ConsoleLogger({ logLevel: this.config.logLevel || 'error' });
    instance = this;
  }

  importModel(model: ValidModel, options?: ImportModelOptions): Controller {
    if (!options?.adapter) validateModel(model);
    const adapterName = options?.adapter?.modelName;
    const m = model as { modelName?: string; name?: string };
    const modelName = adapterName ?? m.modelName ?? m.name ?? String(model);

    if (!this.controllers[modelName]) {
      this.controllers[modelName] = new Controller(model, {
        ...this.defaultConfig,
        ...options,
        logger: this.logger
      });
    }

    return this.controllers[modelName];
  }

  importModels(models: ValidModel[] | Record<string, ValidModel>, options?: ImportModelOptions): void {
    if (Array.isArray(models)) {
      models.forEach((model) => {
        this.importModel(model, options);
      });
    } else if (typeof models === 'object') {
      Object.values(models).forEach((model) => {
        this.importModel(model, options);
      });
    }
  }

  setConfig(newConf: HirokiConfig): void {
    this.config = {
      ...this.defaultConfig,
      ...newConf
    };
    this.logger =
      this.config.logger ??
      new ConsoleLogger({
        logLevel: this.config.logLevel ?? 'error'
      });
  }

  async process(_path: string, params: ProcessRequest): Promise<ProcessResponse> {
    const path = _path.replace(/\/\//ig, '/');

    const currentController = Object.values(this.controllers).find((controller) =>
      controller.check(path)
    );

    if (!currentController) {
      throw new RouteNotFoundError(path);
    }

    try {
      return await currentController.process(path, params) as ProcessResponse;
    } catch (error) {
      this.logger.error(`Hiroki Error: ${error}`);

      if (isHttpError(error)) {
        return error.toJSON();
      }

      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
        code: 'INTERNAL_ERROR'
      } satisfies HttpErrorResponse;
    }
  }
}

export default Hiroki;
