import { expect } from 'chai';
import JWKService from '../../src/services/jwk/jwk.service';

describe('JWK Service Tests', function () {
  it('Should return at least one default key', async function () {
    const jwkProvider = await JWKService.getProviderInstance();

    const keys = jwkProvider.getPublicKeys();

    expect(keys.length).to.be.gte(1);
    expect(keys[0]).to.have.property('kty');
    expect(keys[0]).to.have.property('kid');
    expect(keys[0]).to.have.property('use');
    expect(keys[0]).to.have.property('alg');
    expect(keys[0]).to.have.property('e');
    expect(keys[0]).to.have.property('n');
  });
});
