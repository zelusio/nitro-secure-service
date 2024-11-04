import axios from 'axios';
import crypto from 'node:crypto';
import { JWTIssuer, Scope } from '@zelusio/auth-lib';
import { secrets } from './secrets.service.js';
import { REQUEST_ID_HEADER_NAME } from '../utilities/requestId.js';
import { getJWKProviderInstance } from './jwk/jwkProvider.js';

const NSS_TOKEN_HEADER_NAME = 'X-Nss-Auth';

export interface IAuthWalletEncryptedResponse {
  encrypted_wallet: string;
}

export async function getEncryptedWallet(authToken: string, subject: string, requestId: string): Promise<string> {
  const jwkProvider = getJWKProviderInstance();

  const jwtIssuer = new JWTIssuer(secrets.NSS_ISSUER, await jwkProvider.getDefaultPrivateKey());
  const nssToken = await jwtIssuer.issueAccessToken(subject, [], [Scope.InvisibleWalletExport]);
  const walletEncrypted = await getEncryptedWalletForUser(authToken, nssToken, requestId);

  return walletEncrypted.encrypted_wallet;
}

export async function getEncryptedWalletForUser(
  authToken: string,
  nssToken: string,
  requestId: string
): Promise<IAuthWalletEncryptedResponse> {
  const result = await axios.post(
    `${secrets.AUTH_API_URL}/wallet/encrypted`,
    {},
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        [NSS_TOKEN_HEADER_NAME]: `Bearer ${nssToken}`,
        [REQUEST_ID_HEADER_NAME]: requestId
      }
    }
  );

  if (result.data?.encrypted_wallet) {
    return result.data as IAuthWalletEncryptedResponse;
  }

  throw new Error('Could not get encrypted wallet');
}

export async function encryptByPublicKey(publicKey: string, text: string): Promise<string> {
  const bufferMessage = Buffer.from(text, 'utf8');
  const encrypted = crypto.publicEncrypt(publicKey, bufferMessage);
  // return encrypted as a base64 string
  return encrypted.toString('base64');
}
