import type {
  HirokiAdapter,
  UpdateConfig,
  HirokiQuery,
  HirokiFilter,
  UpdateSet,
  ValidConditions,
  HirokiLogger,
} from 'hiroki';

export interface SequelizeAdapterConfig {
  model: unknown;
}

export class SequelizeAdapter implements HirokiAdapter {
  readonly modelName: string;
  private model: unknown;
  private logger?: HirokiLogger;

  constructor(modelName: string, config: SequelizeAdapterConfig) {
    this.modelName = modelName;
    this.model = config.model;
  }

  canHandle(resource: unknown): boolean {
    return resource === this.modelName;
  }

  setLogger(logger: HirokiLogger): void {
    this.logger = logger;
  }

  async findById(id: string, _query?: HirokiQuery): Promise<unknown> {
    this.logger?.debug(`SequelizeAdapter.findById modelName=${this.modelName} id=${id}`);
    throw new Error('SequelizeAdapter.findById: not implemented');
  }

  async find(_query: HirokiQuery): Promise<unknown> {
    this.logger?.debug(`SequelizeAdapter.find modelName=${this.modelName}`);
    throw new Error('SequelizeAdapter.find: not implemented');
  }

  async count(_query?: HirokiQuery): Promise<number> {
    throw new Error('SequelizeAdapter.count: not implemented');
  }

  async distinct(_field: string): Promise<unknown[]> {
    throw new Error('SequelizeAdapter.distinct: not implemented');
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    this.logger?.debug(`SequelizeAdapter.create modelName=${this.modelName}`);
    throw new Error('SequelizeAdapter.create: not implemented');
  }

  async updateById(id: string, _data: UpdateSet, _config?: UpdateConfig): Promise<unknown> {
    this.logger?.debug(`SequelizeAdapter.updateById modelName=${this.modelName} id=${id}`);
    throw new Error('SequelizeAdapter.updateById: not implemented');
  }

  async updateByConditions(
    _conditions: ValidConditions,
    _data: UpdateSet,
    _config?: UpdateConfig
  ): Promise<unknown> {
    throw new Error('SequelizeAdapter.updateByConditions: not implemented');
  }

  async delete(id: string): Promise<unknown> {
    this.logger?.debug(`SequelizeAdapter.delete modelName=${this.modelName} id=${id}`);
    throw new Error('SequelizeAdapter.delete: not implemented');
  }

  /**
   * Map HirokiFilter[] to Sequelize Op where clause.
   * Implement once sequelize is available via peer dep.
   */
  private buildWhere(_filters: HirokiFilter[]): unknown {
    throw new Error('SequelizeAdapter.buildWhere: not implemented');
  }
}
