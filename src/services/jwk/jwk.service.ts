import jose from 'node-jose';
import logService from '../logging.service.js';
import JWKProvider from './jwkProvider.js';
import JwkS3Store from './jwkS3Store.js';
import S3JobLockService from './s3JobLock.service.js';

const KEY_ROTATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const KEY_ROTATION_LOCK = 'key-rotation';
const LOCK_EXPIRATION_TIME = 30 * 1000; // 30 seconds

/**
 * @class JWKService
 * @description JWK service configures an instance of JWK keys Provider, and handles key rotation
 */
export default class JWKService {
  private static jwkProvider: JWKProvider | undefined;
  private static jobLockService: S3JobLockService | undefined;

  private static keyRotationInterval: NodeJS.Timeout | undefined;

  /**
   * Returns JWKProvider instance
   * @param {IJwkExternalStore} jwkExternalStore
   * @returns {Promise<JWKProvider>}
   */
  public static async getProviderInstance(): Promise<JWKProvider> {
    if (!JWKService.jwkProvider) {
      // create a keystore
      const keystore = jose.JWK.createKeyStore();
      const jwkExternalStore = new JwkS3Store();
      JWKService.jobLockService = new S3JobLockService();

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

      JWKService.jwkProvider = new JWKProvider(keystore, jwkExternalStore);

      // add interval to rotate keys on instance creation
      JWKService.keyRotationInterval = setInterval(async () => {
        if (!JWKService.jwkProvider) {
          logService.error('JWKProvider instance is undefined!');
          return;
        }

        const locked = await JWKService.jobLockService?.tryLockJob(KEY_ROTATION_LOCK, LOCK_EXPIRATION_TIME);
        if (!locked) {
          logService.log(`JWKService key rotation is skipped for job: ${KEY_ROTATION_LOCK}`);
          return;
        }

        try {
          logService.log('JWKService is rotating keys...');
          await JWKService.jwkProvider.rotateKeys();
          logService.log('JWKService rotated keys!');
        } catch (err: unknown) {
          logService.log('An error occurred while the JWKService was rotating keys!');
          logService.error(err);
        } finally {
          await JWKService.jobLockService?.unlockJob(KEY_ROTATION_LOCK);
        }
      }, KEY_ROTATION_INTERVAL);
    }

    return JWKService.jwkProvider;
  }
}
