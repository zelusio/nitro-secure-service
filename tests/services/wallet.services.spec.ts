import { expect } from 'chai';
import { createWallet, getAddressFromPrivateKey } from '../../src/services/wallet.service.js';
import { IDecryptedWallet } from '../../src/interfaces/wallet.interface.js';
import { Wallet } from 'ethers';

describe('Wallet Service Tests', function () {
  it('Create wallet should ok', function () {
    const res: IDecryptedWallet = createWallet();

    expect(res.ethereumAddress).not.eq(undefined);
    expect(res.ethereumAddress.length).eq(42);

    expect(res.mnemonic).not.eq(undefined);
    expect(res.mnemonic.split(' ').length).eq(12);

    expect(res.privateKey).not.eq(undefined);
  });

  it('Should return ethereum address for private key', function () {
    const wallet = Wallet.createRandom();

    const result: string = getAddressFromPrivateKey(wallet.privateKey);

    expect(result).to.equal(wallet.address);
  });
});
