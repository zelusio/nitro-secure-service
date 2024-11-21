import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import { Wallet } from 'ethers';
import { createExpressApp } from '../../src/app.js';
import { decryptBySdk } from '../../src/services/evervault.service.js';
import { IDecryptedWalletService } from '../../src/interfaces/wallet.interface.js';

chai.use(chaiHttp);

describe('Service Wallet API Tests', function () {
  let expressApp: Express;

  before('Create server', async function () {
    expressApp = createExpressApp();
  });

  it('POST /api/v1/service/wallet should return 200', async function () {
    const accountId = 'account_123';

    const res = await chai.request(expressApp).post('/api/v1/service/wallet').send({ accountId });

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

  it('POST /api/v1/service/wallet/import should ok without mnemonic', async function () {
    const wallet = Wallet.createRandom();
    const ethereumAddress = wallet.address;
    const privateKey = wallet.privateKey;
    const accountId = 'account_123';

    const res = await chai.request(expressApp).post('/api/v1/service/wallet/import').send({ accountId, privateKey });

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property('data');
    expect(res.body.data).to.have.property('encryptedWallet');
    expect(res.body.data).to.have.property('ethereumAddress', ethereumAddress);
    expect(res.body.data).to.have.property('accountId', accountId);
    expect(res.body.data).to.have.property('isServiceAccount', true);

    const decrypted = await decryptBySdk(res.body.data.encryptedWallet);

    const decryptedWallet: IDecryptedWalletService = JSON.parse(decrypted);

    expect(decryptedWallet).to.not.have.property('mnemonic');
    expect(decryptedWallet).to.have.property('privateKey', privateKey);
    expect(decryptedWallet).to.have.property('accountId', accountId);
    expect(decryptedWallet).to.have.property('ethereumAddress', ethereumAddress);
    expect(decryptedWallet).to.have.property('isServiceAccount', true);
  });

  it('POST /api/v1/service/wallet/import should return 500 because invalid private key', async function () {
    const privateKey = '0x002';
    const accountId = 'account_123';

    const res = await chai.request(expressApp).post('/api/v1/service/wallet/import').send({ accountId, privateKey });

    expect(res.status).to.equal(500);
    expect(res.body).to.have.property('error');
    expect(res.body?.error).to.have.property('message', 'Could not import wallet for service');
  });
});
