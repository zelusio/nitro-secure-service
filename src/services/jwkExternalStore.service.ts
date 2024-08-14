import jose from 'node-jose';
import { decryptByCage, encryptByCage } from './cage.service';

export async function getKeys(): Promise<jose.JWK.Key[]> {
  const encryptedText = await downloadData();

  if (!encryptedText) {
    return [];
  }

  const text = await decryptByCage(encryptedText);

  const result = JSON.parse(text);
  return result.keys;
}

export async function saveKeys(keys: jose.JWK.Key[]): Promise<void> {
  const text = JSON.stringify({ keys });
  const encryptedText = await encryptByCage(text);

  await uploadData(encryptedText);
}

async function downloadData(): Promise<string | null> {
  // TODO get it from S3 or KMS
  return null;
}

async function uploadData(encryptedText: string): Promise<string> {
  // TODO upload it to S3 or KMS
  return encryptedText;
}
