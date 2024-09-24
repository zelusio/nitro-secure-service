import dotenv from 'dotenv';

dotenv.config();

const { ENVIRONMENT } = process.env;

export const REGION = 'us-east-1';
export const BUCKET_NAME = process.env.BUCKET_NAME || getDefaultBucketName(ENVIRONMENT);
export const S3_KEY = process.env.S3_KEY || `encrypted-keys-${ENVIRONMENT}.txt`;

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
