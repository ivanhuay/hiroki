const registry = new Map<string, string[]>();

export const fieldRestrictionsRegistry = {
  register(modelName: string, disabledFields: string[]): void {
    registry.set(modelName, [...disabledFields]);
  },
  get(modelName: string): string[] {
    return registry.get(modelName) ?? [];
  },
  /** Exposed mainly for test teardown — clears all registrations. */
  clear(): void {
    registry.clear();
  },
};
