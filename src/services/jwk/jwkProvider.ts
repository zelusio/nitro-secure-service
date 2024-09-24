import jose from 'node-jose';
import { IJwkExternalStore } from './IJwkExternalStore';

export default class JWKProvider {
  private readonly keyStore: jose.JWK.KeyStore;
  private readonly jwkExternalStore: IJwkExternalStore;
  private readonly keyIds: string[] = [];

  constructor(keyStore: jose.JWK.KeyStore, jwkExternalStore: IJwkExternalStore) {
    this.keyStore = keyStore;
    this.keyStore.all().forEach((key: jose.JWK.Key) => this.keyIds.push(key.kid!));
    this.jwkExternalStore = jwkExternalStore;
  }

  /**
   * Return the **public** portion of all keys in the keystore
   * @returns {jose.JWK.Key[]}
   */
  public getPublicKeys(): jose.JWK.Key[] {
    return this.keyStore.all().map((key: jose.JWK.Key) => key.toJSON(false) as jose.JWK.Key);
  }

  /**
   * Get a key from the keystore to use for signing. This is the first key in the keystore
   * @returns {jose.JWK.Key}
   */
  public getDefaultSigningKey(): jose.JWK.Key {
    return this.keyStore.get({ use: 'sig', kty: 'RSA', kid: this.keyIds[0] }).toJSON(true) as jose.JWK.Key;
  }

  /**
   * Find the specified key from the keystore
   * @param {string} kid - the key ID
   * @param {string} kty - the key type (should be `RSA`)
   * @param {string} alg - should be (`RS256`)
   * @returns {jose.JWK.Key} - the JWK including private portions
   */
  public findKey(kid: string, kty: string, alg: string): jose.JWK.Key | undefined {
    return this.keyStore.get({ kid, kty, alg })?.toJSON(true) as jose.JWK.Key;
  }

  public async rotateKeys(): Promise<void> {
    const newKey = await this.keyStore.generate('RSA', 2048, {
      alg: 'RS256',
      use: 'sig'
    });

    // put new key in front
    this.keyIds.unshift(newKey.kid);

    // keep only the last 2 keys
    if (this.keyIds.length > 2) {
      // get the last key from the id list
      const keyId = this.keyIds.pop() as string;
      const keyToRemove = this.keyStore.get(keyId);
      if (keyToRemove) {
        this.keyStore.remove(keyToRemove);
      }
    }

    const newKeys = this.keyStore.all().map((key: jose.JWK.Key) => key.toJSON(true) as jose.JWK.Key);
    await this.jwkExternalStore.saveKeys(newKeys);
  }
}
