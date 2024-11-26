import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import { Wallet, Transaction } from 'ethers';
import nock from 'nock';
import { JWKService, JWTIssuer, Scope } from '@zelusio/auth-lib';
import { createExpressApp } from '../../src/app.js';
import { getJWKConfigs } from '../helper.js';
import { encryptWalletForService } from '../../src/services/cage.service.js';

chai.use(chaiHttp);

describe('Transaction Sign API Tests', function () {
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

  it('POST /api/v1/transaction/sign should return 400 because invalid accountId', async function () {
    const authToken = await jwtIssuer.issueAccessToken('EKMS', [], [Scope.NSSTransaction]);

    const wallet = Wallet.createRandom();
    const ethereumAddress = wallet.address;
    const privateKey = wallet.privateKey;
    const accountId = 'account_123';

    const encryptedWalletData = await encryptWalletForService({
      ethereumAddress,
      privateKey,
      accountId
    });

    const accountIdInvalid = 'account_id_invalid';
    const tx = new Transaction();
    tx.to = ethereumAddress;

    const res = await chai
      .request(expressApp)
      .post('/api/v1/transaction/sign')
      .auth(authToken, { type: 'bearer' })
      .send({
        accountId: accountIdInvalid,
        transaction: tx.unsignedSerialized,
        encryptedWallet: encryptedWalletData.encryptedWallet
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
    expect(res.body?.error).to.have.property('message', 'Not valid account');
  });

  it('POST /api/v1/transaction/sign should return 200 with serialized signed transaction', async function () {
    const authToken = await jwtIssuer.issueAccessToken('EKMS', [], [Scope.NSSTransaction]);

    const wallet = Wallet.createRandom();
    const ethereumAddress = wallet.address;
    const privateKey = wallet.privateKey;
    const accountId = 'account_123';

    const encryptedWalletData = await encryptWalletForService({
      ethereumAddress,
      privateKey,
      accountId
    });

    const tx = new Transaction();
    tx.to = ethereumAddress;

    const res = await chai
      .request(expressApp)
      .post('/api/v1/transaction/sign')
      .auth(authToken, { type: 'bearer' })
      .send({
        accountId,
        transaction: tx.unsignedSerialized,
        encryptedWallet: encryptedWalletData.encryptedWallet
      });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('data');
    expect(res.body.data).to.have.property('signedTransaction');
    expect(res.body.data.signedTransaction).to.be.not.null;
  });
});
