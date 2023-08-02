import { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import { createExpressApp } from '../src/app';

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

  it('POST /api/v1/wallet should 500', async function () {
    const email = 'email@test.com'
    const res = await chai.request(expressApp).post('/api/v1/wallet').send({email});

    expect(res.status).to.equal(500); // Because it should be failed outside cage
  });

  it('POST /api/v1/wallet should 500', async function () {
    const phone = '+123456789'
    const res = await chai.request(expressApp).post('/api/v1/wallet').send({phone});

    expect(res.status).to.equal(500); // Because it should be failed outside cage
  });
});
