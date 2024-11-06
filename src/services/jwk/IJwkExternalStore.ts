export interface IJwkExternalStore {
  getKeys<T>(): Promise<T[]>;
  saveKeys<T>(keys: T[]): Promise<void>;
}
