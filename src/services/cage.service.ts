import axios from 'axios';
import * as process from 'process';
import dotenv from 'dotenv';
import {
  IDecryptedWalletEmail,
  IDecryptedWalletPhone,
  IDecryptedWalletService,
  IEncryptedWallet,
  IWalletServiceData
} from '../interfaces/wallet.interface';
import { encryptBySdk } from './evervault.service';
import loggingService from './logging.service';

dotenv.config();

const { ENVIRONMENT } = process.env;
const CAGE_ENCRYPT_URL = 'http://127.0.0.1:9999/encrypt';

export async function encryptByCage(text: string): Promise<string> {
  if (ENVIRONMENT === 'test') {
    return await encryptBySdk(text);
  }

  const result = await axios.post(CAGE_ENCRYPT_URL, { text });

  return result.data.text;
}

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
  };

  const encryptedWallet = await encryptByCage(JSON.stringify(decryptedWallet));

  if (!encryptedWallet) {
    loggingService.error('Encrypted method return null');
    throw new Error('Encrypted method return null');
  }

  return { encryptedWallet };
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
  };

  const encryptedWallet = await encryptByCage(JSON.stringify(decryptedWallet));

  if (!encryptedWallet) {
    loggingService.error('Encrypted method return null');
    throw new Error('Encrypted method return null');
  }

  return { encryptedWallet };
}

export async function encryptWalletForService({
  mnemonic,
  privateKey,
  ethereumAddress,
  accountId
}: IWalletServiceData): Promise<IEncryptedWallet> {
  const decryptedWallet: IDecryptedWalletService = {
    mnemonic,
    privateKey,
    ethereumAddress,
    accountId,
    isServiceAccount: true
  };

  const encryptedWallet = await encryptByCage(JSON.stringify(decryptedWallet));

  if (!encryptedWallet) {
    loggingService.error('Encrypted method return null');
    throw new Error('Encrypted method return null');
  }

  return { encryptedWallet };
}
