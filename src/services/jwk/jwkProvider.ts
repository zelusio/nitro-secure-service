import { JWKService } from '@zelusio/auth-lib';
import logService from '../logging.service.js';
import JwkS3Store from './jwkS3Store.js';
import S3JobLockService from './s3JobLock.service.js';
import { IJwkExternalStore } from './IJwkExternalStore.js';

const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const KEY_ROTATION_LOCK = 'key-rotation';
const LOCK_EXPIRATION_TIME = 30 * 1000; // 30 seconds

let _jwkProvider: JWKProvider | undefined;

export function getJWKProviderInstance(jwkExternalStore: IJwkExternalStore = new JwkS3Store()): JWKProvider {
  if (!_jwkProvider) {
    _jwkProvider = new JWKProvider(jwkExternalStore);
  }
  return _jwkProvider;
}

export default class JWKProvider {
  private lastCreated: number = 0;
  private jwkService: JWKService | undefined;
  private jwkExternalStore: IJwkExternalStore;
  private jobLockService: S3JobLockService = new S3JobLockService();

  constructor(jwkExternalStore: IJwkExternalStore) {
    this.jwkExternalStore = jwkExternalStore;
  }

  public async getPublicKeys() {
    const jwkService = await this.getJWKServiceInstance();
    return jwkService.getPublicKeys();
  }

  public async getDefaultPrivateKey() {
    const jwkService = await this.getJWKServiceInstance();
    return jwkService.getDefaultPrivateKey();
  }

  private async getJWKServiceInstance(): Promise<JWKService> {
    if (Date.now() - this.lastCreated > CACHE_EXPIRATION || !this.jwkService) {
      logService.debug('Looking for JWK keys in external storage...');
      const storedKeys = (await this.jwkExternalStore.getKeys()) as any[];

      if (storedKeys?.length > 0) {
        logService.debug(`Found ${storedKeys.length} JWK keys in external storage.`);
        this.jwkService = new JWKService(storedKeys);
        logService.debug('Created JWKService instance with existing keys from external storage');
      } else {
        logService.debug('Not found any JWK keys in external storage.');
        this.jwkService = await this.createJWKAndStoreKeys();
      }

      this.lastCreated = Date.now();
    }

    return this.jwkService;
  }

  private async createJWKAndStoreKeys(): Promise<JWKService> {
    logService.debug('Creating JWKService instance...');
    const jwkService = new JWKService();
    logService.debug('Generating new keys...');
    const keys = await jwkService.getPrivateKeys();
    logService.debug('Retrieved new keys. Saving to external storage...');
    await this.jwkExternalStore.saveKeys(keys);
    logService.debug('Finished saving new keys to external storage.');
    return jwkService;
  }

  public async rotateKeys() {
    const locked = await this.jobLockService.tryLockJob(KEY_ROTATION_LOCK, LOCK_EXPIRATION_TIME);
    if (!locked) {
      logService.log(`JWKService key rotation is skipped for job: ${KEY_ROTATION_LOCK}`);
      return;
    }

    try {
      logService.log('JWKService is rotating keys...');
      const jwkService = await this.getJWKServiceInstance();
      await jwkService.rotateKeys();
      logService.log('JWKService rotated keys!');

      const keys = await jwkService.getPrivateKeys();
      logService.debug('Retrieved rotated keys. Saving to external storage...');
      await this.jwkExternalStore.saveKeys(keys);
      logService.debug('Finished saving rotated keys to external storage.');
    } catch (err: unknown) {
      logService.log('An error occurred while the JWKService was rotating keys!');
      logService.error(err);
    } finally {
      await this.jobLockService?.unlockJob(KEY_ROTATION_LOCK);
    }
  }
}
