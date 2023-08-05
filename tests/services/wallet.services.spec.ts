import { expect } from 'chai';
import {createWallet} from "../../src/services/wallet.service";
import {IDecryptedWallet} from "../../src/interfaces/wallet.interface";

describe('Wallet Service Tests', function () {

    it('Create wallet should ok', async function () {
        const res: IDecryptedWallet = await createWallet()

        expect(res.ethereumAddress).not.eq(undefined)
        expect(res.ethereumAddress.length).eq(42)

        expect(res.mnemonic).not.eq(undefined)
        expect(res.mnemonic.split(' ').length).eq(12)

        expect(res.privateKey).not.eq(undefined)
    });
});
