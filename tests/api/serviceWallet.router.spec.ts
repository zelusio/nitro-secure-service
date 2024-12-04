import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import nock from 'nock';
import { JWKService, JWTIssuer, Scope } from '@zelusio/auth-lib';
import { createExpressApp } from '../../src/app.js';
import { decryptBySdk } from '../../src/services/evervault.service.js';
import { IDecryptedWalletService } from '../../src/interfaces/wallet.interface.js';
import { getJWKConfigs } from '../helper.js';

chai.use(chaiHttp);

describe('Service Wallet API Tests', function () {
  let expressApp: Express;
  let authApiUrl: string;
  let jwkService: JWKService;
  let jwtIssuer: JWTIssuer;

  before(async function () {
    expressApp = createExpressApp();

    ({ authApiUrl, jwkService, jwtIssuer } = await getJWKConfigs());

    if (!nock.isActive()) {
      nock.activate();
    }
    nock.cleanAll();

    nock(authApiUrl)
      .get('/.well-known/jwks.json')
      .reply(200, await jwkService.getPublicKeys());
  });

  after(function () {
    nock.cleanAll();
    nock.restore();
  });

  it('POST /api/v1/service/wallet should return 200', async function () {
    const accountId = 'account_123';

    const authToken = await jwtIssuer.issueAccessToken('EKMS', [], [Scope.NSSWallet]);

    const res = await chai
      .request(expressApp)
      .post('/api/v1/service/wallet')
      .auth(authToken, { type: 'bearer' })
      .send({ accountId });

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property('data');
    expect(res.body.data).to.have.property('encryptedWallet');
    expect(res.body.data).to.have.property('ethereumAddress');
    expect(res.body.data).to.have.property('accountId', accountId);
    expect(res.body.data).to.have.property('isServiceAccount', true);

    const decrypted = await decryptBySdk(res.body.data.encryptedWallet);

    const decryptedWallet: IDecryptedWalletService = JSON.parse(decrypted);

    expect(decryptedWallet).to.have.property('mnemonic');
    expect(decryptedWallet.mnemonic?.split(' ').length).eq(12);
    expect(decryptedWallet).to.have.property('privateKey');
    expect(decryptedWallet).to.have.property('accountId', accountId);
    expect(decryptedWallet).to.have.property('ethereumAddress', res.body.data.ethereumAddress);
    expect(decryptedWallet).to.have.property('isServiceAccount', true);
  });
});
