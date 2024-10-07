import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import axios from 'axios';
import { createExpressApp } from '../src/app';

chai.use(chaiHttp);

describe('Well-Known API Tests', function () {
  let expressApp: Express;

  before('Create app', async function () {
    expressApp = createExpressApp();
  });

  it('GET /.well-known/jwks.json should return 200 with keys array', async function () {
    const res = await chai.request(expressApp).get('/.well-known/jwks.json');

    expect(res.status).to.equal(200);
    expect(res.body[0]).to.have.property('kty');
    expect(res.body[0]).to.have.property('kid');
    expect(res.body[0]).to.have.property('use');
    expect(res.body[0]).to.have.property('alg');
    expect(res.body[0]).to.have.property('e');
    expect(res.body[0]).to.have.property('n');
  });

  describe('e2e requests to dev', function () {
    it('GET DEV env /.well-known/jwks.json should return 200', async function () {
      const DEV_URL = 'https://nitro-secure-service-dev.app-b81dd8dc1c0d.cage.evervault.com';

      const res = await axios.get(DEV_URL + '/.well-known/jwks.json', {
        headers: {
          'Content-Typ': 'application/json',
          'api-key': process.env.EV_API_KEY
        },
        // httpsAgent: enclaveHttpsAgent,
        validateStatus: () => true
      });

      expect(res.status).to.equal(200);
      expect(res.data).to.have.property('length');
      expect(res.data[0]).to.have.property('kty');
      expect(res.data[0]).to.have.property('kid');
      expect(res.data[0]).to.have.property('use');
      expect(res.data[0]).to.have.property('alg');
      expect(res.data[0]).to.have.property('e');
      expect(res.data[0]).to.have.property('n');
    });
  });
});
