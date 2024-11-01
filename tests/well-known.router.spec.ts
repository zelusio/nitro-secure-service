import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import axios from 'axios';
import { createExpressApp } from '../src/app';
import { secrets } from '../src/services/secrets.service';
import EvervaultClient from '@evervault/sdk';
import AttestationBindings from '@evervault/attestation-bindings';

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

  describe('Requests to DEV enclave', function () {
    const DEV_URL = 'https://nitro-secure-service-dev.app-b81dd8dc1c0d.cage.evervault.com';

    it('GET /.well-known/jwks.json for DEV url should return 200', async function () {
      const res = await axios.get(DEV_URL + '/.well-known/jwks.json', {
        headers: {
          'Content-Type': 'application/json',
          'api-key': secrets.EVERVAULT_API_KEY
        },
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

    it('GET /.well-known/jwks.json for DEV url with attestation should return 200', async function () {
      this.timeout(10000);

      const cageName = 'nitro-secure-service-dev';

      const pcrResponse = await axios.get(`https://api.evervault.com/enclaves/${cageName}/attestation`, {
        headers: {
          'x-evervault-app-id': secrets.EVERVAULT_APP_ID
        }
      });

      const pcrList = pcrResponse.data.data;

      const evervaultClient = new EvervaultClient(secrets.EVERVAULT_APP_ID, secrets.EVERVAULT_API_KEY);

      const enclaveHttpsAgent = await evervaultClient.createEnclaveHttpsAgent(
        {
          [cageName]: pcrList
        },
        AttestationBindings,
        {}
      );

      const res = await axios.get(DEV_URL + '/.well-known/jwks.json', {
        headers: {
          'Content-Type': 'application/json',
          'api-key': secrets.EVERVAULT_API_KEY
        },
        httpsAgent: enclaveHttpsAgent,
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
