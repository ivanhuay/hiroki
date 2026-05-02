import type {
  HirokiAdapter,
  UpdateConfig,
  HirokiQuery,
  HirokiFilter,
  UpdateSet,
  ValidConditions,
  HirokiLogger,
} from 'hiroki';

export interface DrizzleAdapterConfig {
  db: unknown;
  table: unknown;
}

export class DrizzleAdapter implements HirokiAdapter {
  readonly modelName: string;
  private db: unknown;
  private table: unknown;
  private logger?: HirokiLogger;

  constructor(modelName: string, config: DrizzleAdapterConfig) {
    this.modelName = modelName;
    this.db = config.db;
    this.table = config.table;
  }

  canHandle(resource: unknown): boolean {
    return resource === this.modelName;
  }

  setLogger(logger: HirokiLogger): void {
    this.logger = logger;
  }

  async findById(id: string, _query?: HirokiQuery): Promise<unknown> {
    this.logger?.debug(`DrizzleAdapter.findById modelName=${this.modelName} id=${id}`);
    throw new Error('DrizzleAdapter.findById: not implemented');
  }

  async find(_query: HirokiQuery): Promise<unknown> {
    this.logger?.debug(`DrizzleAdapter.find modelName=${this.modelName}`);
    throw new Error('DrizzleAdapter.find: not implemented');
  }

  async count(_query?: HirokiQuery): Promise<number> {
    throw new Error('DrizzleAdapter.count: not implemented');
  }

  async distinct(_field: string): Promise<unknown[]> {
    throw new Error('DrizzleAdapter.distinct: not implemented');
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    this.logger?.debug(`DrizzleAdapter.create modelName=${this.modelName}`);
    throw new Error('DrizzleAdapter.create: not implemented');
  }

  async updateById(id: string, _data: UpdateSet, _config?: UpdateConfig): Promise<unknown> {
    this.logger?.debug(`DrizzleAdapter.updateById modelName=${this.modelName} id=${id}`);
    throw new Error('DrizzleAdapter.updateById: not implemented');
  }

  async updateByConditions(
    _conditions: ValidConditions,
    _data: UpdateSet,
    _config?: UpdateConfig
  ): Promise<unknown> {
    throw new Error('DrizzleAdapter.updateByConditions: not implemented');
  }

  async delete(id: string): Promise<unknown> {
    this.logger?.debug(`DrizzleAdapter.delete modelName=${this.modelName} id=${id}`);
    throw new Error('DrizzleAdapter.delete: not implemented');
  }

  /**
   * Map HirokiFilter[] to Drizzle where conditions.
   * Implement once drizzle-orm is available via peer dep.
   */
  private buildWhere(_filters: HirokiFilter[]): unknown {
    throw new Error('DrizzleAdapter.buildWhere: not implemented');
  }
}
