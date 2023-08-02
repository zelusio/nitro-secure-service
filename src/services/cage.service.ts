import axios from "axios";
import {
    IDecryptedWalletEmail,
    IDecryptedWalletPhone, IEncryptedWallet,
} from "../interfaces/wallet.interface";

const CAGE_ENCRYPT = 'http://127.0.0.1:9999/encrypt';

export async function encryptWalletWithEmail(
    ethereumAddress: string,
    mnemonic: string,
    privateKey: string,
    email: string
): Promise<IEncryptedWallet> {
    const decryptedWallet: IDecryptedWalletEmail = {
        mnemonic,
        privateKey,
        ethereumAddress,
        email
    }

    const result = await axios.post(
        CAGE_ENCRYPT,
        { encryptedWallet: JSON.stringify(decryptedWallet) }
    );

    return <IEncryptedWallet>result.data
}

export async function encryptWalletWithPhone(
    ethereumAddress: string,
    mnemonic: string,
    privateKey: string,
    phone: string
): Promise<IEncryptedWallet> {
    const decryptedWallet: IDecryptedWalletPhone = {
        mnemonic,
        privateKey,
        ethereumAddress,
        phone
    }

    const result = await axios.post(
        CAGE_ENCRYPT,
        { encryptedWallet: JSON.stringify(decryptedWallet) }
    );

    return <IEncryptedWallet>result.data
}