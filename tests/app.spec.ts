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

  it('GET / should 200', async function () {
    const res = await chai.request(expressApp).get('/');

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('status', 'ok');
  });

  it('GET /notValidRoute should 404', async function () {
    const res = await chai.request(expressApp).get('/notValidRoute');

    expect(res.status).to.equal(404);
  });
});
