import { ethers, Wallet } from "ethers";
import {IDecryptedWallet} from "../interfaces/wallet.interface";
import loggingService from "./logging.service";

export function createWallet(): IDecryptedWallet {
    const wallet = Wallet.createRandom()

    const ethereumAddress: string = wallet.address

    if (!wallet.mnemonic) {
        loggingService.error('Error while create random wallet')
        throw Error('Error while create random wallet');
    }

    const mnemonic: string = wallet.mnemonic.phrase
    const privateKey: string = wallet.privateKey

    return { ethereumAddress, mnemonic, privateKey }
}