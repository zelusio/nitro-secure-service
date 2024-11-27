import { secrets } from '../src/services/secrets.service.js';
import { JWKService, JWTIssuer } from '@zelusio/auth-lib';

const authApiUrl: string = secrets.AUTH_API_URL;
let jwkService: JWKService;
let jwtIssuer: JWTIssuer;

export async function getJWKConfigs() {
  if (!jwkService) {
    jwkService = new JWKService();
    jwtIssuer = new JWTIssuer(authApiUrl, await jwkService.getDefaultPrivateKey());
  }

  return {
    authApiUrl,
    jwkService,
    jwtIssuer
  };
}
