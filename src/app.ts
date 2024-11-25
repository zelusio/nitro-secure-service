import express, { Express, Request, Response } from 'express';
import apiV1Router from './api/v1/router.js';
import bodyParser from 'body-parser';
import wellKnownRouter from './api/well-known.router.js';
import { requestId } from './utilities/requestId.js';
import scheduleJobs from './scheduleJobs.js';
import { secrets } from './services/secrets.service.js';

export function createExpressApp() {
  const app: Express = express();
  app.disable('etag');

  // request id middleware adds a unique id to each request and sets this id in a response header
  app.use(requestId());

  // Set up body parsing middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.get('/', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/v1', apiV1Router);
  app.use('/.well-known', wellKnownRouter);

  if (['dev', 'staging', 'prod'].includes(secrets.ENVIRONMENT)) {
    scheduleJobs();
  }

  return app;
}
