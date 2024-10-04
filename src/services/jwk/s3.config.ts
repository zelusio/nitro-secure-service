import { secrets } from '../secrets.service';

export const REGION = 'us-east-1';
export const BUCKET_NAME = secrets.BUCKET_NAME || getDefaultBucketName(secrets.ENVIRONMENT);
export const S3_KEY = secrets.S3_KEY || `encrypted-keys-${secrets.ENVIRONMENT}.txt`;

function getDefaultBucketName(ENVIRONMENT: string | undefined): string {
  switch (ENVIRONMENT) {
    case 'staging':
      return 'nitro-secure-service-keys-staging';
    case 'prod':
      return 'nitro-secure-service-keys-prod';
    default:
      return 'nitro-secure-service-keys-dev';
  }
}
