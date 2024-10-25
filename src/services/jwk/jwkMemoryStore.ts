import jose from 'node-jose';
import { IJwkExternalStore } from './IJwkExternalStore.js';

export default class JwkMemoryStore implements IJwkExternalStore {
  private keys: jose.JWK.Key[] | undefined;

  public async getKeys(): Promise<jose.JWK.Key[]> {
    if (!this.keys) {
      return [];
    }
    return Promise.resolve(this.keys);
  }

  public async saveKeys(keys: jose.JWK.Key[]): Promise<void> {
    this.keys = keys;
    return Promise.resolve();
  }
}
