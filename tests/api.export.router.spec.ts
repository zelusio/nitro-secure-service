import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import { createExpressApp } from '../src/app';
import { JWKService, JWTIssuer, requireJWT, requireScope, Scope, JWTMiddlewareOptions } from '@zelusio/auth-lib';

chai.use(chaiHttp);

describe('Wallet Export API Tests', function () {
  let expressApp: Express;

  before('Create server', async function () {
    expressApp = createExpressApp();
  });

  it('POST /api/v1/wallet/export should return 401 because no token', async function () {
    const res = await chai.request(expressApp).post('/api/v1/wallet/export').send({ public_key: 'public_key' });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error');
    expect(res.body?.error).to.have.property('message', 'No authorization header found');
  });

  it('POST /api/v1/wallet/export should return 401 because invalid token', async function () {
    const res = await chai
      .request(expressApp)
      .post('/api/v1/wallet/export')
      .auth('invalid', { type: 'bearer' })
      .send({ public_key: 'public_key' });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error');
    expect(res.body?.error).to.have.property('message', 'Invalid Token or Protected Header formatting');
  });

  describe('Wallet Export API with replaced jwt middlewares', function () {
    let jwtIssuer: JWTIssuer;

    before(async function () {
      const jwkService = new JWKService();
      jwtIssuer = new JWTIssuer('http://localhost:8000', await jwkService.getDefaultPrivateKey());

      const options: JWTMiddlewareOptions = {
        jwtOptions: {
          issuer: 'http://localhost:8000',
          jwkPublicPortion: JSON.stringify(await jwkService.getPublicKeys())
        },
        transformErrorResponse: (err: unknown) => {
          const error = {
            message: err instanceof Error ? err.message : (err as string)
          };
          return { body: { error } };
        }
      };
      const mainRouter: any = Array.from(expressApp._router.stack).find((l: any) => l.name === 'router');
      const mainRouterStack = mainRouter?.handle?.stack;
      const exRouter: any = Array.from(mainRouterStack).find((l: any) => l.route.path === '/wallet/export');

      if (exRouter?.route?.stack[0]) {
        exRouter.route.stack[0].handle = requireJWT(options);
      }

      if (exRouter?.route?.stack[1]) {
        exRouter.route.stack[1].handle = requireScope({ scopes: [Scope.InvisibleWalletExport], ...options });
      }
    });

    it('POST /api/v1/wallet/export should return 403 because no scope', async function () {
      const token = await jwtIssuer.issueAccessToken('testing');

      const res = await chai
        .request(expressApp)
        .post('/api/v1/wallet/export')
        .auth(token, { type: 'bearer' })
        .send({ public_key: 'public_key' });

      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error');
      expect(res.body?.error).to.have.property('message', 'Insufficient scope');
    });

    it('POST /api/v1/wallet/export should return 501 because not implemented', async function () {
      const token = await jwtIssuer.issueAccessToken('testing', [], [Scope.InvisibleWalletExport]);

      const res = await chai
        .request(expressApp)
        .post('/api/v1/wallet/export')
        .auth(token, { type: 'bearer' })
        .send({ public_key: 'public_key' });

      expect(res.status).to.equal(501);
      expect(res.body).to.have.property('message', 'Not implemented');
    });
  });
});
