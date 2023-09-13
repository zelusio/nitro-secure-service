import express, {Express, Request, Response} from 'express';
import apiV1Router from './api/v1/router';
import bodyParser from "body-parser";


export function createExpressApp() {
    const app: Express = express();
    app.disable('etag');

    // Set up body parsing middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.get('/', (req: Request, res: Response) => {
        res.json({ status: 'ok' });
    });

    app.use('/api/v1', apiV1Router);

    return app;
}

