import Controller, { ControllerConfig, ProcessParams } from './controller';
import { RouteNotFoundError, isHttpError } from './errors';
import Validator from './validator';

// Hiroki configuration interface
export interface HirokiConfig {
  basePath?: string;
}

// Import model options
export interface ImportModelOptions extends ControllerConfig {}

// Process request interface
export interface ProcessRequest extends ProcessParams {}

// Process response interface
export interface ProcessResponse {
  error?: string;
  status?: number;
  code?: string;
  details?: unknown;
  [key: string]: any;
}

let instance: Hiroki | null = null;

class Hiroki {
  private defaultConfig: HirokiConfig;
  public config: HirokiConfig;
  public models: Record<string, any>;
  public controllers: Record<string, Controller>;

  constructor() {
    if (instance) {
      return instance;
    }
    
    this.defaultConfig = {
      basePath: '/api'
    };
    
    this.config = { ...this.defaultConfig };
    this.models = {};
    this.controllers = {};
    instance = this;
  }

  importModel(model: any, options?: ImportModelOptions): Controller {
    Validator.validateModel(model);
    const collectionName = model?.collection?.collectionName;
    const instanceName = model?.constructor?.modelName;
    const modelName = instanceName || collectionName || model.modelName || model.name || String(model);
    
    if (!this.controllers[modelName]) {
      this.controllers[modelName] = new Controller(model, {
        ...this.defaultConfig,
        ...options
      });
    }
    
    return this.controllers[modelName];
  }

  importModels(models: any[] | Record<string, any>, options?: ImportModelOptions): void {
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
  }

  async process(_path: string, params: ProcessRequest): Promise<any | ProcessResponse> {
    const path = _path.replace(/\/\//ig, '/'); // Normalize path to avoid issues with double slashes
    
    const currentController = Object.values(this.controllers).find((controller) =>
      controller.check(path)
    );
    
    if (!currentController) {
      throw new RouteNotFoundError(path);
    }
    
    try {
      return await currentController.process(path, params);
    } catch (error) {
      console.error('Hiroki Error: ', error);
      
      // Handle HttpError instances with proper serialization
      if (isHttpError(error)) {
        return error.toJSON();
      }
      
      // Handle unknown errors
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
        code: 'INTERNAL_ERROR'
      };
    }
  }
}

export default Hiroki;
