import dotenv from 'dotenv';

dotenv.config();

export interface ISecrets {
  ENVIRONMENT: string;
  EVERVAULT_APP_ID: string;
  EVERVAULT_API_KEY: string;
  AUTH_API_URL: string;
  AUTH_ISSUER: string;
  NSS_ISSUER: string;
  BUCKET_NAME?: string;
  S3_KEY?: string;
}

/**
 * Retrieve a variable from the process environment, throwing an exception if it isn't there
 * @param variableName - the name of the variable to retrieve from the environment
 * @param defaultValue - the optional value to return if the variable isn't found
 */
function requireEnv(variableName: string, defaultValue?: string): string {
  const value = process.env[variableName] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable ${variableName}!`);
  }
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
  EVERVAULT_APP_ID: requireEnv('EVERVAULT_APP_ID', 'test'), // it is used only in tests
  EVERVAULT_API_KEY: requireEnv('EVERVAULT_API_KEY', 'test'), // it is used only in tests
  AUTH_API_URL: requireEnv('AUTH_API_URL', 'http://localhost:8000'),
  AUTH_ISSUER: requireEnv('AUTH_ISSUER', 'http://localhost:8000'),
  NSS_ISSUER: requireEnv('NSS_ISSUER', 'http://localhost:3000'),
  BUCKET_NAME: process.env.BUCKET_NAME,
  S3_KEY: process.env.S3_KEY
};
