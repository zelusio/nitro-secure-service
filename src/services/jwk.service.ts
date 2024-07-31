import jose from 'node-jose';
import logService from './logging.service';

/**
 * @class JWKService
 * @description This service handles managing JSON Web Keys (JWK) for the rest of the application. It handles loading them, rotating them, and making them available to the rest of the application in a **protected** manner
 * @method {Promise<JWKService>} getInstance - the singleton constructor
 * @method {Promise<jose.JWK.Key[]>} getKeys - get the public portion of all keys in the keystore
 * @method {Promise<jose.JWK.Key>} getDefaultSigningKey - get the default signing key from the keystore. Includes the private portion of the key
 */
export class JWKService {
  private static instance: JWKService | undefined;

  private readonly keyStore: jose.JWK.KeyStore;
  private readonly keyIds: string[] = [];

  /**
   * The private constructor, to be called by the singleton constructor {@link getInstance} with a keystore instance
   * @param {JWK.KeyStore} keystore
   * @private
   */
  private constructor(keystore: jose.JWK.KeyStore) {
    this.keyStore = keystore;
    this.keyStore.all().forEach((key: jose.JWK.Key) => this.keyIds.push(key.kid!));
  }

  /**
   * The singleton constructor
   * @returns {Promise<JWKService>}
   */
  public static async getInstance(): Promise<JWKService> {
    if (!JWKService.instance) {
      // create a keystore
      const keystore = jose.JWK.createKeyStore();

      // TODO: where should be stored keys (external storage)?

      logService.debug(`Generating new keys...`);
      await keystore.generate('RSA', 2048, {
        alg: 'RS256',
        use: 'sig'
      });
      logService.debug(`Finished generating new keys!`);

      // TODO: what about key rotation?

      JWKService.instance = new JWKService(keystore);
    }

    return JWKService.instance;
  }

  /**
   * Return the **public** portion of all keys in the keystore
   * @returns {jose.JWK.Key[]}
   */
  public getKeys(): jose.JWK.Key[] {
    return this.keyStore.all();
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
}

export default JWKService;
