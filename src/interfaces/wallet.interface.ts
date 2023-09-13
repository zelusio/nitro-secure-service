
export interface IDecryptedWallet {
    ethereumAddress: string
    mnemonic: string
    privateKey: string
}

export interface IDecryptedWalletEmail {
    ethereumAddress: string
    mnemonic: string
    privateKey: string
    email: string
}
export interface IDecryptedWalletPhone {
    ethereumAddress: string
    mnemonic: string
    privateKey: string
    phone: string
}

export interface IEncryptedWallet {
    encryptedWallet: string
}