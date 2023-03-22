import Joi from 'joi'
import {Request, Response, NextFunction} from 'express'

export enum RequestSource {
    body = 'body',
    query = 'query',
    params = 'params',
}

const joiOptions = {
    abortEarly: false,
    allowUnknown: true,     // allow unknown properties in a request
    stripUnknown: true      // but, remove them from the request
}

/**
 * Function to validate the request against the schema
 * @param {e.Request} request
 * @param {e.Response} response
 * @param {e.NextFunction} next
 * @param {Joi.AnySchema} schema
 * @param {RequestSource} source
 * @returns {e.Response<any, Record<string, any>>}
 */
function validateRequestAgainstSchema(
    request: Request,
    response: Response,
    next: NextFunction,
    schema: Joi.AnySchema,
    source: RequestSource
) {
    // Do the validation
    const {error, value} = schema.validate(request[source], joiOptions)

    // If the schema does not validate, return a 400 error that indicates the validation error
    if (error) {
        console.error(`Error validating request: `, error.message)
        return response.status(400).json({message: `Validation error: ${error.message}`})
    }

    // If the schema validates, call the next middleware
    request[source] = value
    next()
}

/**
 * Return a middleware to validate a request against a given Joi schema
 * @param {Joi.AnySchema} schema - the JOI schema to check the request against
 * @param {RequestSource} source - the source of the request to validate (body, query, params)
 */
export function validateRequest(schema: Joi.AnySchema, source = RequestSource.body) {
    return (request: Request, response: Response, next: NextFunction) => {
        validateRequestAgainstSchema(request, response, next, schema, source)
    }
}