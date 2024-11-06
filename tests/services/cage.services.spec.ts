import { expect } from 'chai';
import { decryptBySdk } from '../../src/services/evervault.service.js';
import {
  encryptWalletForService,
  encryptWalletWithEmail,
  encryptWalletWithPhone
} from '../../src/services/cage.service.js';
import {
  IDecryptedWalletEmail,
  IDecryptedWalletPhone,
  IDecryptedWalletService
} from '../../src/interfaces/wallet.interface.js';

describe('Cage Service Tests', function () {
  it('encryptWalletWithEmail should ok', async function () {
    const ethereumAddress = '0x001';
    const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
    const privateKey = '0x002';
    const email = 'test@email.com';

    const res = await encryptWalletWithEmail(ethereumAddress, mnemonic, privateKey, email);

    expect(res).to.have.property('encryptedWallet');

    const decrypted = await decryptBySdk(res.encryptedWallet);

    const decryptedWallet: IDecryptedWalletEmail = JSON.parse(decrypted);

    expect(decryptedWallet.ethereumAddress).to.eq(ethereumAddress);
    expect(decryptedWallet.mnemonic).to.eq(mnemonic);
    expect(decryptedWallet.privateKey).to.eq(privateKey);
    expect(decryptedWallet.email).to.eq(email);
  });

  it('encryptWalletWithPhone should ok', async function () {
    const ethereumAddress = '0x001';
    const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
    const privateKey = '0x002';
    const phone = 'test@email.com';

    const res = await encryptWalletWithPhone(ethereumAddress, mnemonic, privateKey, phone);

    expect(res).to.have.property('encryptedWallet');

    const decrypted = await decryptBySdk(res.encryptedWallet);

    const decryptedWallet: IDecryptedWalletPhone = JSON.parse(decrypted);

    expect(decryptedWallet.ethereumAddress).to.eq(ethereumAddress);
    expect(decryptedWallet.mnemonic).to.eq(mnemonic);
    expect(decryptedWallet.privateKey).to.eq(privateKey);
    expect(decryptedWallet.phone).to.eq(phone);
  });

  it('encryptWalletForService should ok', async function () {
    const ethereumAddress = '0x001';
    const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
    const privateKey = '0x002';
    const accountId = 'account_123';

    const res = await encryptWalletForService({ ethereumAddress, mnemonic, privateKey, accountId });

    expect(res).to.have.property('encryptedWallet');

    const decrypted = await decryptBySdk(res.encryptedWallet);

    const decryptedWallet: IDecryptedWalletService = JSON.parse(decrypted);

    expect(decryptedWallet.ethereumAddress).to.eq(ethereumAddress);
    expect(decryptedWallet.mnemonic).to.eq(mnemonic);
    expect(decryptedWallet.privateKey).to.eq(privateKey);
    expect(decryptedWallet.accountId).to.eq(accountId);
    expect(decryptedWallet.isServiceAccount).to.eq(true);
  });

  it('encryptWalletForService should ok without mnemonic', async function () {
    const ethereumAddress = '0x001';
    const privateKey = '0x002';
    const accountId = 'account_123';

    const res = await encryptWalletForService({ ethereumAddress, privateKey, accountId });

    expect(res).to.have.property('encryptedWallet');

    const decrypted = await decryptBySdk(res.encryptedWallet);

    const decryptedWallet: IDecryptedWalletService = JSON.parse(decrypted);

    expect(decryptedWallet.ethereumAddress).to.eq(ethereumAddress);
    expect(decryptedWallet.mnemonic).to.eq(undefined);
    expect(decryptedWallet.privateKey).to.eq(privateKey);
    expect(decryptedWallet.accountId).to.eq(accountId);
    expect(decryptedWallet.isServiceAccount).to.eq(true);
  });
});
