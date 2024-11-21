import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import { Wallet, Transaction } from 'ethers';
import { createExpressApp } from '../../src/app.js';

chai.use(chaiHttp);

describe('Transaction Sign API Tests', function () {
  let expressApp: Express;

  before('Create server', async function () {
    expressApp = createExpressApp();
  });

  it('POST /api/v1/transaction/sign should return 400 because invalid accountId', async function () {
    const wallet = Wallet.createRandom();
    const ethereumAddress = wallet.address;
    const privateKey = wallet.privateKey;
    const accountId = 'account_123';

    const resImport = await chai
      .request(expressApp)
      .post('/api/v1/service/wallet/import')
      .send({ accountId, privateKey });

    expect(resImport.status).to.equal(200);

    expect(resImport.body).to.have.property('data');
    expect(resImport.body.data).to.have.property('encryptedWallet');
    expect(resImport.body.data).to.have.property('ethereumAddress', ethereumAddress);
    expect(resImport.body.data).to.have.property('accountId', accountId);
    expect(resImport.body.data).to.have.property('isServiceAccount', true);

    const accountIdInvalid = 'account_id_invalid';
    const tx = new Transaction();
    tx.to = ethereumAddress;

    const res = await chai.request(expressApp).post('/api/v1/transaction/sign').send({
      accountId: accountIdInvalid,
      transaction: tx.unsignedSerialized,
      encryptedWallet: resImport.body.data.encryptedWallet
    });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
    expect(res.body?.error).to.have.property('message', 'Not valid account');
  });

  it('POST /api/v1/transaction/sign should return 200 with serialized signed transaction', async function () {
    const wallet = Wallet.createRandom();
    const ethereumAddress = wallet.address;
    const privateKey = wallet.privateKey;
    const accountId = 'account_123';

    const resImport = await chai
      .request(expressApp)
      .post('/api/v1/service/wallet/import')
      .send({ accountId, privateKey });

    expect(resImport.status).to.equal(200);

    expect(resImport.body).to.have.property('data');
    expect(resImport.body.data).to.have.property('encryptedWallet');
    expect(resImport.body.data).to.have.property('ethereumAddress', ethereumAddress);
    expect(resImport.body.data).to.have.property('accountId', accountId);
    expect(resImport.body.data).to.have.property('isServiceAccount', true);

    const tx = new Transaction();
    tx.to = ethereumAddress;

    const res = await chai.request(expressApp).post('/api/v1/transaction/sign').send({
      accountId,
      transaction: tx.unsignedSerialized,
      encryptedWallet: resImport.body.data.encryptedWallet
    });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('data');
    expect(res.body.data).to.have.property('signedTransaction');
    expect(res.body.data.signedTransaction).to.be.not.null;
  });
});
