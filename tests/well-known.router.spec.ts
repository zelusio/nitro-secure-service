import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
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
    expect(res.body).to.be.lengthOf(1);
    expect(res.body[0]).to.have.property('kty');
    expect(res.body[0]).to.have.property('kid');
    expect(res.body[0]).to.have.property('use');
    expect(res.body[0]).to.have.property('alg');
    expect(res.body[0]).to.have.property('e');
    expect(res.body[0]).to.have.property('n');
  });
});
