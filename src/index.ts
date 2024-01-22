import { createExpressApp } from './app';

const port = process.env.PORT || 3000;

const app = createExpressApp();

app.listen(port, () => {
  console.log(`[Server]: Running at port ${port}`);
});
