import { expect } from 'chai';

import {decryptBySdk, encryptBySdk} from "../../src/services/evervault.service";

describe('Evervault Service Tests', function () {

    it('Encrypt buy SDK should ok', async function () {
        const data = { foo: "bar" };
        const res = await encryptBySdk(JSON.stringify(data))

        expect(res).not.eq(undefined)
        expect(res).not.eq(JSON.stringify(data))
    });

    it('Decrypt by SDK should ok', async function () {
        const data = { foo: "bar" };
        const encrypted = await encryptBySdk(JSON.stringify(data))

        const res = await decryptBySdk(encrypted)

        const decrypted = JSON.parse(res);

        expect(decrypted.foo).to.eq('bar')
    });
});
