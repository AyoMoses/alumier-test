import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const validateWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const hmacHeader = req.get('X-Shopify-Hmac-SHA256');
  const body = req.body.toString();

  console.log('Validating webhook');
  console.log('HMAC Header:', hmacHeader);

  if (!process.env.SHOPIFY_WEBHOOK_SECRET) {
    console.error('SHOPIFY_WEBHOOK_SECRET is not set in environment variables');
    return res.status(500).send('Server configuration error');
  }

  const generatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body)
    .digest('base64');

  console.log('Generated Hash:', generatedHash);

  if (generatedHash === hmacHeader) {
    console.log('Webhook validation successful');
    next();
  } else {
    console.log('Webhook validation failed');
    res.status(401).send('Invalid webhook signature');
  }
};
