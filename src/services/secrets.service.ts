import dotenv from 'dotenv';

dotenv.config();

export interface ISecrets {
  ENVIRONMENT: string;
  EVERVAULT_APP_ID: string;
  EVERVAULT_API_KEY: string;
  AUTH_API_URL: string;
  AUTH_ISSUER: string;
  NSS_API_URL: string;
  NSS_ISSUER: string;
  BUCKET_NAME?: string;
  S3_KEY?: string;
}

/**
 * Retrieve a variable from the process environment, throwing an exception if it isn't there
 * @param variableName - the name of the variable to retrieve from the environment
 */
function requireEnv(variableName: string): string {
  const value = process.env[variableName];
  if (!value) throw new Error(`Missing environment variable ${variableName}!`);
  return value;
}

/**
 * This object is responsible for pulling in all of the environment secrets and making them available to the rest
 * of the app in a strongly-typed, centralized way so that we aren't pulling in secrets from the env in multiple files.
 * Additionally, this will ensure an exception is always thrown if we're missing keys. Finally, this handles all
 * environment-related (prod/dev/staging) issues
 */
export const secrets: ISecrets = {
  ENVIRONMENT: requireEnv('ENVIRONMENT'),
  EVERVAULT_APP_ID: requireEnv('EVERVAULT_APP_ID'),
  EVERVAULT_API_KEY: requireEnv('EVERVAULT_API_KEY'),
  AUTH_API_URL: requireEnv('AUTH_API_URL'),
  AUTH_ISSUER: requireEnv('AUTH_ISSUER'),
  NSS_API_URL: requireEnv('NSS_API_URL'),
  NSS_ISSUER: requireEnv('NSS_ISSUER'),
  BUCKET_NAME: process.env.BUCKET_NAME,
  S3_KEY: process.env.S3_KEY
};
