import { Request, Response, Router } from 'express';
import {createWallet, } from "../../services/wallet.service";
import {IDecryptedWallet, IEncryptedWallet} from "../../interfaces/wallet.interface";
import {encryptWalletWithEmail, encryptWalletWithPhone} from "../../services/cage.service";
import loggingService from "../../services/logging.service";
import {
  IResponseError,
  IResponseWalletCreateEmail,
  IResponseWalletCreatePhone
} from "../../interfaces/response.interface";
import {ERROR_CODES} from "../../constants/errors";

const router: Router = Router();
export default router;

router.get('/version', (req: Request, res: Response) => {
  return res.json({ version: '1' });
});

// CREATE NEW WALLET AND ENCRYPT
router.post("/wallet", async (req: Request, res: Response) => {
  try {
    const {email, phone } = req.body
    const wallet: IDecryptedWallet = createWallet();
    const ethereumAddress = wallet.ethereumAddress

    if (email) {
      const encryptedWallet: IEncryptedWallet = await encryptWalletWithEmail(
          ethereumAddress,
          wallet.mnemonic,
          wallet.privateKey,
          email
      )

      const data: IResponseWalletCreateEmail = {
        ...encryptedWallet,
        ethereumAddress,
        email
      }

      res.send({ data });
    }

    if (phone) {
      const encryptedWallet: IEncryptedWallet = await encryptWalletWithPhone(
          ethereumAddress,
          wallet.mnemonic,
          wallet.privateKey,
          phone
      )

      const data: IResponseWalletCreatePhone = {
        ...encryptedWallet,
        ethereumAddress,
        phone
      }

      res.send({ data });
    }

    const error: IResponseError = {
      message: 'No valid identity',
      code: ERROR_CODES.BAD_REQUEST
    }

    res.send({ error });
  } catch (err: any) {
    loggingService.error("Could not create wallet", err.message);

    const error: IResponseError = {
      message: 'Could not create wallet',
      code: ERROR_CODES.INTERNAL_ERROR
    }

    res.status(500).send({ error })
  }
});
