import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import nock from 'nock';
import { Express } from 'express';
import crypto from 'node:crypto';
import { JWKService, JWTIssuer, Scope } from '@zelusio/auth-lib';
import { createExpressApp } from '../src/app';
import { encryptWalletWithEmail } from '../src/services/cage.service';
import { secrets } from '../src/services/secrets.service';

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

  describe('Wallet Export API with mocked auth service responses', function () {
    let authApiUrl: string;
    let jwkService: JWKService;
    let jwtIssuer: JWTIssuer;

    before(async function () {
      authApiUrl = secrets.AUTH_API_URL;
      jwkService = new JWKService();
      jwtIssuer = new JWTIssuer(authApiUrl, await jwkService.getDefaultPrivateKey());

      if (!nock.isActive()) {
        nock.activate();
      }
    });

    afterEach(function () {
      nock.cleanAll();
    });

    after(function () {
      nock.restore();
    });

    it('POST /api/v1/wallet/export should return 200', async function () {
      const wallet = {
        email: 'test_user_1@mail.com',
        ethereumAddress: '0xtest',
        privateKey: '0xtest',
        mnemonic: 'testing'
      };

      const authToken = await jwtIssuer.issueAccessToken('test_user_1', [], [Scope.InvisibleWalletExport], {
        email: wallet.email
      });

      const { encryptedWallet } = await encryptWalletWithEmail(
        wallet.ethereumAddress,
        wallet.mnemonic,
        wallet.privateKey,
        wallet.email
      );

      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'pkcs1',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs1',
          format: 'pem'
        }
      });

      const publicKey = keyPair.publicKey.toString();

      const scopeKeys = nock(authApiUrl)
        .get('/.well-known/jwks.json')
        .reply(200, await jwkService.getPublicKeys());

      const scopeEncrypted = nock(authApiUrl)
        .post('/wallet/encrypted')
        .reply(200, { encrypted_wallet: encryptedWallet });

      const res = await chai
        .request(expressApp)
        .post('/api/v1/wallet/export')
        .auth(authToken, { type: 'bearer' })
        .send({ public_key: publicKey });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('invisible_wallet');
      expect(res.body.data.invisible_wallet.length).to.be.greaterThan(0);

      const privateKey = keyPair.privateKey.toString();
      const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(res.body.data.invisible_wallet, 'base64'));
      const result = JSON.parse(decrypted.toString());

      expect(result).to.deep.equal(wallet);
      expect(scopeKeys.isDone()).to.equal(true);
      expect(scopeEncrypted.isDone()).to.equal(true);
    });

    it('POST /api/v1/wallet/export should return 403 because no scope', async function () {
      const token = await jwtIssuer.issueAccessToken('test_user_2');

      const scopeKeys = nock(authApiUrl)
        .get('/.well-known/jwks.json')
        .reply(200, await jwkService.getPublicKeys());

      const res = await chai
        .request(expressApp)
        .post('/api/v1/wallet/export')
        .auth(token, { type: 'bearer' })
        .send({ public_key: 'public_key' });

      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error');
      expect(res.body?.error).to.have.property('code', 'UNAUTHORIZED');
      expect(res.body?.error).to.have.property('message', 'Insufficient scope');
      expect(scopeKeys.isDone()).to.equal(false); // public keys response was cached from previous test
    });

    it('POST /api/v1/wallet/export should return 403 because not equal emails', async function () {
      const wallet = {
        email: 'test_user_3@mail.com',
        ethereumAddress: '0xtest',
        privateKey: '0xtest',
        mnemonic: 'testing'
      };

      const authToken = await jwtIssuer.issueAccessToken('test_user_3', [], [Scope.InvisibleWalletExport], {
        email: 'other_test_user_3@mail.com'
      });

      const { encryptedWallet } = await encryptWalletWithEmail(
        wallet.ethereumAddress,
        wallet.mnemonic,
        wallet.privateKey,
        wallet.email
      );

      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'pkcs1',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs1',
          format: 'pem'
        }
      });

      const publicKey = keyPair.publicKey.toString();

      const scopeKeys = nock(authApiUrl)
        .get('/.well-known/jwks.json')
        .reply(200, await jwkService.getPublicKeys());

      const scopeEncrypted = nock(authApiUrl)
        .post('/wallet/encrypted')
        .reply(200, { encrypted_wallet: encryptedWallet });

      const res = await chai
        .request(expressApp)
        .post('/api/v1/wallet/export')
        .auth(authToken, { type: 'bearer' })
        .send({ public_key: publicKey });

      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error');
      expect(res.body?.error).to.have.property('code', 'FORBIDDEN');
      expect(res.body?.error).to.have.property('message', 'Could not export wallet');
      expect(scopeKeys.isDone()).to.equal(false); // public keys response was cached from previous test
      expect(scopeEncrypted.isDone()).to.equal(true);
    });
  });
});
