import { Request, Response, Router } from 'express';
import { ethers } from 'ethers';
import { createWallet, getAddressFromPrivateKey } from '../../services/wallet.service';
import { IDecryptedWallet, IDecryptedWalletService, IEncryptedWallet } from '../../interfaces/wallet.interface';
import {
  decryptWalletForService,
  encryptWalletForService,
  encryptWalletWithEmail,
  encryptWalletWithPhone
} from '../../services/cage.service';
import loggingService from '../../services/logging.service';
import {
  IResponseError,
  IResponseSignedTransaction,
  IResponseWalletCreateEmail,
  IResponseWalletCreatePhone,
  IResponseWalletCreateService
} from '../../interfaces/response.interface';
import { ERROR_CODES } from '../../constants/errors';

const router: Router = Router();
export default router;

router.get('/version', (req: Request, res: Response) => {
  return res.json({ version: '1' });
});

// CREATE NEW WALLET AND ENCRYPT
router.post('/wallet', async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.body;
    const wallet: IDecryptedWallet = createWallet();
    const ethereumAddress = wallet.ethereumAddress;

    if (email) {
      const encryptedWallet: IEncryptedWallet = await encryptWalletWithEmail(
        ethereumAddress,
        wallet.mnemonic,
        wallet.privateKey,
        email
      );

      const data: IResponseWalletCreateEmail = {
        ...encryptedWallet,
        ethereumAddress,
        email
      };

      return res.send({ data });
    }

    if (phone) {
      const encryptedWallet: IEncryptedWallet = await encryptWalletWithPhone(
        ethereumAddress,
        wallet.mnemonic,
        wallet.privateKey,
        phone
      );

      const data: IResponseWalletCreatePhone = {
        ...encryptedWallet,
        ethereumAddress,
        phone
      };

      return res.send({ data });
    }

    const error: IResponseError = {
      message: 'No valid identity',
      code: ERROR_CODES.BAD_REQUEST
    };

    return res.send({ error });
  } catch (err: any) {
    loggingService.error('Could not create wallet', err.message);

    const error: IResponseError = {
      message: 'Could not create wallet',
      code: ERROR_CODES.INTERNAL_ERROR
    };

    return res.status(500).send({ error });
  }
});

// CREATE NEW WALLET AND ENCRYPT FOR SERVICE ACCOUNT
router.post('/service/wallet', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.body;
    const wallet: IDecryptedWallet = createWallet();
    const ethereumAddress = wallet.ethereumAddress;

    const encryptedWallet: IEncryptedWallet = await encryptWalletForService({
      ethereumAddress,
      mnemonic: wallet.mnemonic,
      privateKey: wallet.privateKey,
      accountId
    });

    const data: IResponseWalletCreateService = {
      ...encryptedWallet,
      ethereumAddress,
      accountId,
      isServiceAccount: true
    };

    return res.send({ data });
  } catch (err: any) {
    loggingService.error('Could not create wallet for service', err.message);

    const error: IResponseError = {
      message: 'Could not create wallet for service',
      code: ERROR_CODES.INTERNAL_ERROR
    };

    return res.status(500).send({ error });
  }
});

// ENCRYPT IMPORTED WALLET FOR SERVICE WALLET
router.post('/service/wallet/import', async (req: Request, res: Response) => {
  try {
    const { accountId, privateKey } = req.body;

    const ethereumAddress = getAddressFromPrivateKey(privateKey);

    const encryptedWallet: IEncryptedWallet = await encryptWalletForService({
      ethereumAddress,
      privateKey,
      accountId
    });

    const data: IResponseWalletCreateService = {
      ...encryptedWallet,
      ethereumAddress,
      accountId,
      isServiceAccount: true
    };

    return res.send({ data });
  } catch (err: any) {
    loggingService.error('Could not import wallet for service', err.message);

    const error: IResponseError = {
      message: 'Could not import wallet for service',
      code: ERROR_CODES.INTERNAL_ERROR
    };

    return res.status(500).send({ error });
  }
});

router.post('/transaction/sign', async (req: Request, res: Response) => {
  try {
    const { accountId, transaction, encryptedWallet } = req.body;

    const decryptedWallet: IDecryptedWalletService = await decryptWalletForService({ encryptedWallet });

    if (!(decryptedWallet.isServiceAccount && accountId === decryptedWallet.accountId)) {
      return res.status(400).send({
        error: {
          message: 'Not valid account',
          code: ERROR_CODES.BAD_REQUEST
        }
      });
    }
    const unsignedTx = ethers.Transaction.from(transaction);
    const signerWallet = new ethers.Wallet(decryptedWallet.privateKey);
    const signedTransaction = await signerWallet.signTransaction(unsignedTx);

    const data: IResponseSignedTransaction = {
      signedTransaction
    };

    return res.status(200).send({ data });
  } catch (err: any) {
    loggingService.error('Could not sign transaction', err.message);

    const error: IResponseError = {
      message: err.message || 'Could not sign transaction',
      code: ERROR_CODES.INTERNAL_ERROR
    };

    return res.status(500).send({ error });
  }
});
