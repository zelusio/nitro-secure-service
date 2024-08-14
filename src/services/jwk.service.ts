import jose from 'node-jose';
import logService from './logging.service';
import * as jwkExternalStore from './jwkExternalStore.service';

const KEY_ROTATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

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
  private keyRotationInterval: NodeJS.Timeout | undefined;

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

      logService.debug(`Looking for JWK keys in external storage...`);
      const keys = await jwkExternalStore.getKeys();

      if (keys && keys.length > 0) {
        logService.debug(`Found ${keys.length} JWK keys in external storage!`);
        await Promise.all(keys.map(key => keystore.add(key, 'json')));
        logService.debug('Finished adding keys to keystore from external storage');
      } else {
        logService.debug('Not found any JWK keys in external storage. Generating new keys...');
        await keystore.generate('RSA', 2048, {
          alg: 'RS256',
          use: 'sig'
        });
        logService.debug('Finished generating new keys!');
        const newKeys = keystore.all().map((key: jose.JWK.Key) => key.toJSON(true) as jose.JWK.Key);
        await jwkExternalStore.saveKeys(newKeys);
        logService.debug('Finished saving new keys to external storage!');
      }

      JWKService.instance = new JWKService(keystore);

      // add interval to rotate keys on instance creation
      JWKService.instance.keyRotationInterval = setInterval(
        () =>
          JWKService.getInstance()
            .then(jwkService => {
              return jwkService.rotateKeys();
            })
            .then(() => logService.log('JWKService rotated keys!'))
            .catch((err: unknown) => {
              logService.log('An error occurred while the JWKService was rotating keys!');
              logService.error(err);
            }),
        KEY_ROTATION_INTERVAL
      );
    }

    return JWKService.instance;
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
    await jwkExternalStore.saveKeys(newKeys);
    logService.debug('Finished saving new keys to external storage!');
  }
}

export default JWKService;
