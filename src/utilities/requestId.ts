import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';

export const ID_ATTRIBUTE_NAME = 'id';

export const REQUEST_ID_HEADER_NAME = 'X-Request-Id';

export interface RequestWithId extends Request {
  [ID_ATTRIBUTE_NAME]: string;
}

/**
 * Returns middleware that uses existed request identifier from header or generates a unique identifier for each incoming request.
 * The middleware stores the identifier in the request object under the 'id' attribute, and sets the response header with the request id.
 *
 * @param {Function} [options.generator] - function that generates a unique identifier. Defaults to `randomUUID` from crypto.
 * @param {String} [options.headerName] - the name of the header to set with the request id. Defaults to 'X-Request-Id'.
 * @param {Boolean} [options.setHeader] - whether or not to set the header. Defaults to true.
 *
 * @returns {Function} - middleware function
 */
export function requestId({ generator = randomUUID, headerName = REQUEST_ID_HEADER_NAME, setHeader = true } = {}) {
  return function requestIdMiddleware(request: Request, response: Response, next: NextFunction) {
    const oldValue = request.get(headerName);
    const id = oldValue ?? generator();

    if (setHeader) {
      response.set(headerName, id);
    }

    (<RequestWithId>request)[ID_ATTRIBUTE_NAME] = id;

    next();
  };
}
