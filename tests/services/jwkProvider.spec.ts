import { expect } from 'chai';
import JWKProvider from '../../src/services/jwk/jwkProvider.js';
import JwkMemoryStore from '../../src/services/jwk/jwkMemoryStore.js';

describe('JWK Provider Tests', function () {
  it('Should return created one key', async function () {
    const jwkProvider = new JWKProvider(new JwkMemoryStore());

    const keys = await jwkProvider.getPublicKeys();

    expect(keys).to.be.lengthOf(1);
    expect(keys[0]).to.have.property('kty');
    expect(keys[0]).to.have.property('kid');
    expect(keys[0]).to.have.property('use');
    expect(keys[0]).to.have.property('alg');
    expect(keys[0]).to.have.property('e');
    expect(keys[0]).to.have.property('n');
  });

  it('Should return 2 keys after rotating', async function () {
    const jwkProvider = new JWKProvider(new JwkMemoryStore());

    await jwkProvider.rotateKeys();

    const keys = await jwkProvider.getPublicKeys();

    expect(keys).to.be.lengthOf(2);
    expect(keys[0]).to.have.property('kty');
    expect(keys[0]).to.have.property('kid');
    expect(keys[0]).to.have.property('use');
    expect(keys[0]).to.have.property('alg');
    expect(keys[0]).to.have.property('e');
    expect(keys[0]).to.have.property('n');
  });

  it('Should return only 2 keys after 2 rotating', async function () {
    this.timeout(5000);

    const jwkProvider = new JWKProvider(new JwkMemoryStore());

    await jwkProvider.rotateKeys();
    await jwkProvider.rotateKeys();

    const keys = await jwkProvider.getPublicKeys();

    expect(keys).to.be.lengthOf(2);
  });
});
