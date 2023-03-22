import Joi from 'joi';

/**
 * Schema to validate the request to create a new wallet. Contains only the encrypted mnemonic
 * @type {Joi.ObjectSchema<any>}
 */
export const decryptMnemonicSchema = Joi.object({
    mnemonic: Joi.string().required(),
});