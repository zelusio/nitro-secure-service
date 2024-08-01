import { expect } from 'chai';
import JWKService from '../../src/services/jwk.service';

describe('JWK Service Tests', function () {
  it('Should return created one key', async function () {
    const jwkService = await JWKService.getInstance();

    const keys = jwkService.getKeys();

    expect(keys).to.be.lengthOf(1);
    expect(keys[0]).to.have.property('kty');
    expect(keys[0]).to.have.property('kid');
    expect(keys[0]).to.have.property('use');
    expect(keys[0]).to.have.property('alg');
    expect(keys[0]).to.have.property('e');
    expect(keys[0]).to.have.property('n');
  });

  it('Should return 2 keys after rotating', async function () {
    const jwkService = await JWKService.getInstance();

    await jwkService.rotateKeys();

    const keys = jwkService.getKeys();

    expect(keys).to.be.lengthOf(2);
    expect(keys[0]).to.have.property('kty');
    expect(keys[0]).to.have.property('kid');
    expect(keys[0]).to.have.property('use');
    expect(keys[0]).to.have.property('alg');
    expect(keys[0]).to.have.property('e');
    expect(keys[0]).to.have.property('n');
  });

  it('Should return only 2 keys after 2 rotating', async function () {
    const jwkService = await JWKService.getInstance();

    await jwkService.rotateKeys();
    await jwkService.rotateKeys();

    const keys = jwkService.getKeys();

    expect(keys).to.be.lengthOf(2);
  });
});
