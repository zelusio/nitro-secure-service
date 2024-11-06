import { Request } from 'express';

/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
export function log(...args: any[]) {
  console.log(`[${new Date().toISOString()} INFO  ] `, ...args);
}

export function error(...args: any[]) {
  console.error(`[${new Date().toISOString()} ERROR ] `, ...args);
}

export function debug(...args: any[]) {
  console.debug(`[${new Date().toISOString()} DEBUG ] `, ...args);
}

export function logForRequest(request: Request | any, ...args: any[]) {
  console.log(`[${new Date().toISOString()} #${request.id.substring(0, 8)} INFO  ] `, ...args);
}

export function errorForRequest(request: Request | any, ...args: any[]) {
  console.error(
    `[${new Date().toISOString()} #${request.id.substring(0, 8)} ERROR ] `,
    request.baseUrl,
    request.path,
    ...args
  );
}

export default {
  log,
  error,
  debug,
  logForRequest,
  errorForRequest
};
