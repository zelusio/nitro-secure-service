import { Request, Response, Router } from 'express';
import { ethers } from 'ethers';
import { requireJWT, requireScope, Scope, JWTMiddlewareOptions, verifyJWT } from '@zelusio/auth-lib';
import { createWallet, getAddressFromPrivateKey } from '../../services/wallet.service';
import { IDecryptedWallet, IDecryptedWalletService, IEncryptedWallet } from '../../interfaces/wallet.interface';
import {
  decryptWalletForService,
  decryptWalletWithEmail,
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
import { encryptByPublicKey, getEncryptedWallet } from '../../services/exportWallet.service';
import { secrets } from '../../services/secrets.service';
import { RequestWithId } from '../../utilities/requestId';

const router: Router = Router();
export default router;

const jwtMiddlewareOptions: JWTMiddlewareOptions = {
  jwtOptions: {
    jwksUrl: `${secrets.AUTH_API_URL}/.well-known/jwks.json`,
    issuer: secrets.AUTH_ISSUER || ''
  },
  transformErrorResponse: (err: unknown) => {
    const error: IResponseError = {
      message: err instanceof Error ? err.message : (err as string),
      code: ERROR_CODES.UNAUTHORIZED
    };
    return { body: { error } };
  }
};

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

const MESSAGE_NOT_EXPORT = 'Could not export wallet';

// EXPORT WALLET
router.post(
  '/wallet/export',
  requireJWT(jwtMiddlewareOptions),
  requireScope({ scopes: [Scope.InvisibleWalletExport], ...jwtMiddlewareOptions }),
  async (req: Request, res: Response) => {
    try {
      const { public_key } = req.body;

      const authToken = (req.headers['authorization'] as string).split(' ')[1];

      const payload = await verifyJWT(authToken, jwtMiddlewareOptions.jwtOptions);
      const subject = payload.sub as string;
      const email = payload.email as string;

      const encryptedWalletText = await getEncryptedWallet(authToken, subject, (req as RequestWithId).id);
      const decryptedWalletWithEmail = await decryptWalletWithEmail({ encryptedWallet: encryptedWalletText });

      if (email !== decryptedWalletWithEmail.email) {
        const error: IResponseError = {
          message: MESSAGE_NOT_EXPORT,
          code: ERROR_CODES.FORBIDDEN
        };

        return res.status(403).send({ error });
      }

      const invisibleWallet = await encryptByPublicKey(public_key, JSON.stringify(decryptedWalletWithEmail));

      return res.status(200).send({ data: { invisible_wallet: invisibleWallet } });
    } catch (err: any) {
      loggingService.error(MESSAGE_NOT_EXPORT, err.message);

      const error: IResponseError = {
        message: secrets.ENVIRONMENT === 'dev' ? err.message : MESSAGE_NOT_EXPORT,
        code: ERROR_CODES.INTERNAL_ERROR
      };

      return res.status(500).send({ error });
    }
  }
);

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

    if (!accountId || !privateKey) {
      return res.status(400).send({
        error: {
          message: 'Not provided accountId or privateKey',
          code: ERROR_CODES.BAD_REQUEST
        }
      });
    }

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

    return res.status(200).send({ data });
  } catch (err: any) {
    loggingService.error('Could not import wallet for service', err.message);

    const error: IResponseError = {
      message: 'Could not import wallet for service',
      code: ERROR_CODES.INTERNAL_ERROR
    };

    return res.status(500).send({ error });
  }
});

// SIGN TRANSACTION
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
