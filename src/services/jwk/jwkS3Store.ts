import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { IJwkExternalStore } from './IJwkExternalStore.js';
import { decryptByCage, encryptByCage } from '../cage.service.js';
import { BUCKET_NAME, S3_KEY, REGION } from './s3.config.js';

export default class JwkS3Store implements IJwkExternalStore {
  private readonly s3client: S3Client;
  private readonly bucketName: string;
  private readonly objectKey: string;

  constructor(bucketName = BUCKET_NAME, objectKey = S3_KEY) {
    this.s3client = new S3Client({ region: REGION });
    this.bucketName = bucketName;
    this.objectKey = objectKey;
  }

  public async getKeys(): Promise<any[]> {
    const encryptedText = await this.getObjectFromS3();

    if (!encryptedText) {
      return [];
    }

    const text = await decryptByCage(encryptedText);

    const result = JSON.parse(text);
    return result.keys;
  }

  private async getObjectFromS3(): Promise<string | undefined> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: this.objectKey
      });

      const data = await this.s3client.send(command);

      return data.Body?.transformToString();
    } catch (err) {
      return undefined;
    }
  }

  async saveKeys(keys: any[]): Promise<void> {
    const text = JSON.stringify({ keys, updatedAt: Date.now() });
    const encryptedText = await encryptByCage(text);

    await this.putObjectToS3(encryptedText);
  }

  private async putObjectToS3(encryptedText: string): Promise<boolean> {
    const contentMD5Hash = crypto.createHash('md5').update(encryptedText).digest('base64');

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: S3_KEY,
      Body: encryptedText,
      ContentMD5: contentMD5Hash
    });

    const data = await this.s3client.send(command);

    return data.$metadata.httpStatusCode === 200;
  }
}
