import crypto from 'crypto';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, REGION } from './s3.config';

export class S3JobLockService {
  private readonly s3client: S3Client;
  private readonly bucketName: string;
  private readonly jobHandlerId: string;

  constructor(bucketName: string = BUCKET_NAME) {
    this.s3client = new S3Client({ region: REGION });
    this.bucketName = bucketName;
    this.jobHandlerId = crypto.randomUUID();
  }

  async tryLockJob(jobName: string, expirationTime: number): Promise<boolean> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: `${jobName}-lock-${this.jobHandlerId}`,
      Body: this.jobHandlerId,
      ContentMD5: crypto.createHash('md5').update(this.jobHandlerId).digest('base64'),
      Expires: new Date(Date.now() + expirationTime * 2) // However, AWS S3 will delete the objects once a day.
    });

    const data = await this.s3client.send(command);

    const locksList = await this.s3client.send(
      new ListObjectsV2Command({
        Prefix: `${jobName}-lock-`,
        Bucket: this.bucketName
      })
    );

    // get first element in expirationTime window
    // warning: S3 stores LastModified in seconds, for example: 2024-09-24T13:25:40.000Z
    const firstInWindow = locksList.Contents?.filter(
      item => (item.LastModified as Date).valueOf() > Date.now() - expirationTime
    )
      .sort((a, b) => {
        const aModified = (a.LastModified as Date).valueOf();
        const bModified = (b.LastModified as Date).valueOf();
        if (aModified === bModified) {
          return (a.ETag as string).localeCompare(b.ETag as string);
        }
        return aModified - bModified;
      })
      .shift();

    if (firstInWindow?.ETag === data.ETag) {
      return true;
    }

    return false;
  }

  async unlockJob(jobName: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: `${jobName}-lock-${this.jobHandlerId}`
      });

      const data = await this.s3client.send(command);
      return data?.$metadata?.httpStatusCode === 204;
    } catch (err) {
      return false;
    }
  }
}

export default S3JobLockService;
