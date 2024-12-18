import { Request, Response, Router } from 'express';
import { getJWKProviderInstance } from '../services/jwk/jwkProvider.js';

const router: Router = Router();

export default router;

/**
 * @swagger
 * tags:
 *   name: .well-known
 *   description: Verification router
 */

/**
 * @swagger
 * /.well-known/jwks.json:
 *   get:
 *     description: Verifications keys for verify auth tokens
 *     tags: [.well-known]
 *     responses:
 *       200:
 *         description: Keys.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 properties:
 *                   kty:
 *                     type: string
 *                     example: RSA
 *                   kid:
 *                     type: string
 *                     example: FXM-k6AaF6k6AaF6k6AaF6k6AaF6k6AaF6
 *                   use:
 *                     type: string
 *                     example: sig
 *                   alg:
 *                     type: string
 *                     example: RS256
 *                   e:
 *                     type: string
 *                     example: AQAB
 *                   n:
 *                     type: string
 *                     example: uyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmNuyWnebUmN
 *
 */
router.get('/jwks.json', getPublicJWKs);

async function getPublicJWKs(request: Request, response: Response) {
  const jwkProvider = getJWKProviderInstance();
  const publicKeys = await jwkProvider.getPublicKeys();
  return response.status(200).json(publicKeys);
}
