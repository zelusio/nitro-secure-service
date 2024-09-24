import { expect } from 'chai';
import jose from 'node-jose';
import JWKProvider from '../../src/services/jwk/jwkProvider';
import JwkMemoryStore from '../../src/services/jwk/jwkMemoryStore';

describe('JWK Provider Tests', function () {
  it('Should return created one key', async function () {
    const keystore = jose.JWK.createKeyStore();
    await keystore.generate('RSA', 2048, {
      alg: 'RS256',
      use: 'sig'
    });
    const jwkProvider = new JWKProvider(keystore, new JwkMemoryStore());

    const keys = jwkProvider.getPublicKeys();

    expect(keys).to.be.lengthOf(1);
    expect(keys[0]).to.have.property('kty');
    expect(keys[0]).to.have.property('kid');
    expect(keys[0]).to.have.property('use');
    expect(keys[0]).to.have.property('alg');
    expect(keys[0]).to.have.property('e');
    expect(keys[0]).to.have.property('n');
  });

  it('Should return 2 keys after rotating', async function () {
    const keystore = jose.JWK.createKeyStore();
    await keystore.generate('RSA', 2048, {
      alg: 'RS256',
      use: 'sig'
    });
    const jwkProvider = new JWKProvider(keystore, new JwkMemoryStore());

    await jwkProvider.rotateKeys();

    const keys = jwkProvider.getPublicKeys();

    expect(keys).to.be.lengthOf(2);
    expect(keys[0]).to.have.property('kty');
    expect(keys[0]).to.have.property('kid');
    expect(keys[0]).to.have.property('use');
    expect(keys[0]).to.have.property('alg');
    expect(keys[0]).to.have.property('e');
    expect(keys[0]).to.have.property('n');
  });

  it('Should return only 2 keys after 2 rotating', async function () {
    const keystore = jose.JWK.createKeyStore();
    await keystore.generate('RSA', 2048, {
      alg: 'RS256',
      use: 'sig'
    });
    const jwkProvider = new JWKProvider(keystore, new JwkMemoryStore());

    await jwkProvider.rotateKeys();
    await jwkProvider.rotateKeys();

    const keys = jwkProvider.getPublicKeys();

    expect(keys).to.be.lengthOf(2);
  });
});
