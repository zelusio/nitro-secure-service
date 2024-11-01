import { IJwkExternalStore } from './IJwkExternalStore.js';

export default class JwkMemoryStore implements IJwkExternalStore {
  private keys: any[] | undefined;

  public async getKeys<T>(): Promise<T[]> {
    if (!this.keys) {
      return [];
    }
    return Promise.resolve(this.keys);
  }

  public async saveKeys<T>(keys: T[]): Promise<void> {
    this.keys = keys;
    return Promise.resolve();
  }
}
