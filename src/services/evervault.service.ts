import Evervault from '@evervault/sdk';
import { secrets } from './secrets.service.js';

const { ENVIRONMENT, EVERVAULT_APP_ID, EVERVAULT_API_KEY } = secrets;

// Mock evervault because in cage we don't need it
const mockEvervault = {
  decrypt: async () => null,
  encrypt: async () => null
};

export const evervault =
  ENVIRONMENT === 'test' ? new Evervault(EVERVAULT_APP_ID as string, EVERVAULT_API_KEY as string) : mockEvervault;

export async function decryptBySdk(text: string): Promise<string> {
  return await evervault.decrypt(text);
}

export async function encryptBySdk(text: string): Promise<string> {
  return await evervault.encrypt(text);
}
