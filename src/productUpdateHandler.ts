import type { Request, Response } from 'express';
import { GraphQLClient } from 'graphql-request';
import { sendAlertEmail } from './emailService.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const SHOPIFY_SHOP = process.env.SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PRICE_DECREASE_THRESHOLD = Number.parseFloat(
  process.env.PRICE_DECREASE_THRESHOLD || '10'
);

const client = new GraphQLClient(
  `https://${SHOPIFY_SHOP}/admin/api/2024-10/graphql.json`,
  {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN!,
    },
  }
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRICE_HISTORY_FILE = path.join(__dirname, 'priceHistory.json');

async function readPriceHistory(): Promise<Record<string, number>> {
  try {
    const data = await fs.readFile(PRICE_HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No price history found, creating new file');
    return {};
  }
}

async function writePriceHistory(
  history: Record<string, number>
): Promise<void> {
  await fs.writeFile(PRICE_HISTORY_FILE, JSON.stringify(history, null, 2));
}

export const handleProductUpdate = async (req: Request, res: Response) => {
  try {
    const productData = JSON.parse(req.body.toString());
    const productId = productData.id.toString();
    const productDetails = await fetchProductDetails(productId);

    console.log('Updated product details:', productDetails);

    const newPrice = Number.parseFloat(
      productDetails.variants.edges[0].node.price
    );
    const priceHistory = await readPriceHistory();

    console.log('Price history:', priceHistory);
    console.log('Product ID:', productId);

    const oldPrice = priceHistory[productId] || newPrice;

    console.log(`Old price from history: ${oldPrice}`);

    const percentageDecrease = ((oldPrice - newPrice) / oldPrice) * 100;

    console.log(
      `Old price: ${oldPrice}, New price: ${newPrice}, Percentage decrease: ${percentageDecrease.toFixed(
        2
      )}%`
    );
    console.log(`Alert threshold: ${PRICE_DECREASE_THRESHOLD}%`);

    if (percentageDecrease > PRICE_DECREASE_THRESHOLD) {
      await sendAlertEmail(
        productDetails.title,
        oldPrice,
        newPrice,
        percentageDecrease
      );
      console.log(
        `Alert email sent for ${percentageDecrease.toFixed(2)}% decrease`
      );
    } else {
      console.log(
        `Price decrease of ${percentageDecrease.toFixed(
          2
        )}% not significant enough for alert (threshold: ${PRICE_DECREASE_THRESHOLD}%)`
      );
    }

    // Update price history
    priceHistory[productId] = newPrice;
    await writePriceHistory(priceHistory);
    console.log('Updated price history:', priceHistory);

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
};

const fetchProductDetails = async (productId: string) => {
  const query = `
    query($productId: ID!) {
      product(id: $productId) {
        title
        variants(first: 1) {
          edges {
            node {
              price
            }
          }
        }
      }
    }
  `;

  const variables = { productId: `gid://shopify/Product/${productId}` };
  const data: any = await client.request(query, variables);

  return {
    title: data.product.title,
    variants: data.product.variants,
  };
};
