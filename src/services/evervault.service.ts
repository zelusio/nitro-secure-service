import Evervault from '@evervault/sdk'
import dotenv from 'dotenv'

dotenv.config()

const {EVERVAULT_APP_ID, EVERVAULT_API_KEY } = process.env
export const evervault = new Evervault(EVERVAULT_APP_ID as string, EVERVAULT_API_KEY as string)

export async function decryptBySdk(text: string): Promise<string> {
    return await evervault.decrypt(text);
}

export async function encryptBySdk(text: string): Promise<string> {
    return await evervault.encrypt(text);
}