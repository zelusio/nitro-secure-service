import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import { Wallet, Transaction } from 'ethers';
import { createExpressApp } from '../src/app.js';
import { decryptBySdk } from '../src/services/evervault.service.js';
import {
  IDecryptedWalletEmail,
  IDecryptedWalletPhone,
  IDecryptedWalletService
} from '../src/interfaces/wallet.interface.js';

chai.use(chaiHttp);

describe('HTTP Status Code Tests', function () {
  let expressApp: Express;

  before('Create server', async function () {
    expressApp = createExpressApp();
  });

  it('GET /api/v1/version should 200', async function () {
    const res = await chai.request(expressApp).get('/api/v1/version');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('version', '1');
  });

  it('POST /api/v1/wallet with email should ok', async function () {
    const email = 'email@test.com';
    const res = await chai.request(expressApp).post('/api/v1/wallet').send({ email });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('data');
    expect(res.body.data).to.have.property('encryptedWallet');
    expect(res.body.data).to.have.property('ethereumAddress');
    expect(res.body.data).to.have.property('email');
    expect(res.body.data.email).to.eq(email);

    const decrypted = await decryptBySdk(res.body.data.encryptedWallet);

    const decryptedWallet: IDecryptedWalletEmail = JSON.parse(decrypted);

    expect(decryptedWallet).to.have.property('mnemonic');
    expect(decryptedWallet.mnemonic.split(' ').length).eq(12);
    expect(decryptedWallet).to.have.property('privateKey');
    expect(decryptedWallet.email).to.eq(email);
    expect(decryptedWallet.ethereumAddress).to.eq(res.body.data.ethereumAddress);
  });

  it('POST /api/v1/wallet many times with email should ok', async function () {
    for (let i = 0; i < 10; i++) {
      const email = `email_${i}.test.com`;
      const res = await chai.request(expressApp).post('/api/v1/wallet').send({ email });

      expect(res.status).to.equal(200);
    }
  });

  it('POST /api/v1/wallet with phone should ok', async function () {
    const phone = '+123456789';
    const res = await chai.request(expressApp).post('/api/v1/wallet').send({ phone });

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property('data');
    expect(res.body.data).to.have.property('encryptedWallet');
    expect(res.body.data).to.have.property('ethereumAddress');
    expect(res.body.data).to.have.property('phone');
    expect(res.body.data.phone).to.eq(phone);

    const decrypted = await decryptBySdk(res.body.data.encryptedWallet);

    const decryptedWallet: IDecryptedWalletPhone = JSON.parse(decrypted);

    expect(decryptedWallet).to.have.property('mnemonic');
    expect(decryptedWallet.mnemonic.split(' ').length).eq(12);
    expect(decryptedWallet).to.have.property('privateKey');
    expect(decryptedWallet.phone).to.eq(phone);
    expect(decryptedWallet.ethereumAddress).to.eq(res.body.data.ethereumAddress);
  });

  it('POST /api/v1/service/wallet should ok', async function () {
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

  describe('POST /api/v1/transaction/sign', function () {
    it('should return 400 because invalid accountId', async function () {
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

    it('should return 200 with serialized signed transaction', async function () {
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
});
