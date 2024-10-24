import axios from 'axios';
import crypto from 'node:crypto';
import { JWTIssuer, Scope } from '@zelusio/auth-lib';
import JWKService from './jwk/jwk.service';
import { secrets } from './secrets.service';
import { HEADER_NAME } from '../utilities/requestId';

export interface IAuthWalletEncryptedResponse {
  encrypted_wallet: string;
}

export async function getEncryptedWallet(authToken: string, subject: string, requestId: string): Promise<string> {
  const keyServiceInstance = await JWKService.getProviderInstance();

  const jwtIssuer = new JWTIssuer(secrets.NSS_ISSUER, await keyServiceInstance.getDefaultSigningKey());
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
        'nss-auth': `Bearer ${nssToken}`,
        [HEADER_NAME]: requestId
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
