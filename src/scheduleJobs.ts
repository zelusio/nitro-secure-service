import { getJWKProviderInstance } from './services/jwk/jwkProvider.js';

const KEY_ROTATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
let keyRotationInterval: NodeJS.Timeout | undefined;

export default function scheduleJobs() {
  if (!keyRotationInterval) {
    keyRotationInterval = setInterval(async () => {
      const jwkProvider = getJWKProviderInstance();
      await jwkProvider.rotateKeys();
    }, KEY_ROTATION_INTERVAL);
  }
}
