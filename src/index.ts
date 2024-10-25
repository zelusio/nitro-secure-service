import { createExpressApp } from './app.js';

const port = process.env.PORT || 3000;

const app = createExpressApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[Server]: Running at port ${port}`);
});
