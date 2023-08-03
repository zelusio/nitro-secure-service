import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import { createExpressApp } from '../src/app';
import {decryptBySdk} from "../src/services/evervault.service";
import {IDecryptedWalletEmail, IDecryptedWalletPhone} from "../src/interfaces/wallet.interface";

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
    const email = 'email@test.com'
    const res = await chai.request(expressApp).post('/api/v1/wallet').send({email});

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('data');
    expect(res.body.data).to.have.property('encryptedWallet');
    expect(res.body.data).to.have.property('ethereumAddress');
    expect(res.body.data).to.have.property('email');
    expect(res.body.data.email).to.eq(email);

    const decrypted = await decryptBySdk(res.body.data.encryptedWallet)

    const decryptedWallet: IDecryptedWalletEmail = JSON.parse(decrypted);

    expect(decryptedWallet).to.have.property('mnemonic');
    expect(decryptedWallet.mnemonic.split(' ').length).eq(12)
    expect(decryptedWallet).to.have.property('privateKey');
    expect(decryptedWallet.email).to.eq(email)
    expect(decryptedWallet.ethereumAddress).to.eq(res.body.data.ethereumAddress)
  });

  it('POST /api/v1/wallet with phone should ok', async function () {
    const phone = '+123456789'
    const res = await chai.request(expressApp).post('/api/v1/wallet').send({phone});

    expect(res.status).to.equal(200);

    expect(res.body).to.have.property('data');
    expect(res.body.data).to.have.property('encryptedWallet');
    expect(res.body.data).to.have.property('ethereumAddress');
    expect(res.body.data).to.have.property('phone');
    expect(res.body.data.phone).to.eq(phone);

    const decrypted = await decryptBySdk(res.body.data.encryptedWallet)

    const decryptedWallet: IDecryptedWalletPhone = JSON.parse(decrypted);

    expect(decryptedWallet).to.have.property('mnemonic');
    expect(decryptedWallet.mnemonic.split(' ').length).eq(12)
    expect(decryptedWallet).to.have.property('privateKey');
    expect(decryptedWallet.phone).to.eq(phone)
    expect(decryptedWallet.ethereumAddress).to.eq(res.body.data.ethereumAddress)
  });
});