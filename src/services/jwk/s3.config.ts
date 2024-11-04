import { secrets } from '../secrets.service.js';

export const REGION = 'us-east-1';
export const BUCKET_NAME = secrets.BUCKET_NAME || 'nitro-secure-service-keys-dev';
export const S3_KEY = secrets.S3_KEY || `encrypted-keys-${secrets.ENVIRONMENT}.txt`;
