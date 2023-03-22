import {Router, Request, Response, NextFunction} from 'express'
import {ethers} from 'ethers'
import {evervault} from '../services/evervault.service'
import * as schemas from './wallet.router.schema'
import {validateRequest} from '../services/request-validation.service'

export const walletRouter: Router = Router()
walletRouter.get('/new', createWallet)
walletRouter.post('/decrypt', validateRequest(schemas.decryptMnemonicSchema), decryptMnemonic)

/**
 * Create a new wallet and return the encrypted mnemonic as well as the unencrypted address
 * @param {e.Request} request
 * @param {e.Response} response
 * @param {e.NextFunction} next
 * @returns {Promise<e.Response<any, Record<string, any>>>}
 */
async function createWallet(request: Request, response: Response, next:NextFunction){
    const wallet = ethers.Wallet.createRandom()
    // @ts-ignore
    const mnemonic = await evervault.encrypt(wallet.mnemonic.phrase)
    console.log(`encrypted mnemonic: `, mnemonic)
    return response.status(200).json({
        mnemonic:mnemonic,
        address: wallet.address
    })
}

/**
 * Return the automatically-decrypted mnemonic to the user. This WILL NOT WORK Locally.
 * TODO: Verify that the user owns the wallet. THIS IS A SECURITY RISK RIGHT NOW, SINCE IT FUNCTIONS DECRYPTION ORACLE
 * @param {e.Request} request
 * @param {e.Response} response
 * @param {e.NextFunction} next
 * @returns {Promise<e.Response<any, Record<string, any>>>}
 */
async function decryptMnemonic(request: Request, response: Response, next:NextFunction){
    const {mnemonic} = request.body

    // NOTE: while the user includes the mnemonic ENCRYPTED in the request, when the request hits the cage, it is decrypted
    // SO, we can send it back without re-encrypting
    return response.status(200).json({
        mnemonic
    })
}