import express from 'express';
import dotenv from 'dotenv';
import { validateWebhook } from './webhookValidator.js';
import { handleProductUpdate } from './productUpdateHandler.js';

dotenv.config();

const app = express();
app.use(express.raw({ type: 'application/json' }));

const port = process.env.PORT || 3000;

app.post(
  '/webhooks/products/update',
  (req, res, next) => {
    console.log('Received webhook request');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', req.body.toString());
    next();
  },
  validateWebhook,
  handleProductUpdate
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
