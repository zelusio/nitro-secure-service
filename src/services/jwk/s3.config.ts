import dotenv from 'dotenv';

dotenv.config();

export const REGION = 'us-east-1';
export const BUCKET_NAME = process.env.BUCKET_NAME || 'nitro-secure-service-keys-dev';
export const S3_KEY = process.env.S3_KEY || 'encrypted-keys.txt';
