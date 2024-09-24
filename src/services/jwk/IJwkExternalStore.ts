import jose from 'node-jose';

export interface IJwkExternalStore {
  getKeys(): Promise<jose.JWK.Key[]>;
  saveKeys(keys: jose.JWK.Key[]): Promise<void>;
}
