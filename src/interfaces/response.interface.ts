export interface IResponseWalletCreateEmail {
    email: string,
    ethereumAddress: string
    encryptedWallet: string
}

export interface IResponseWalletCreatePhone {
    phone: string,
    ethereumAddress: string
    encryptedWallet: string
}

export interface IResponseError {
    message: string
    code: string
}