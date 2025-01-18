import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/.env` });

const shopify = shopifyApi({
  apiKey: process.env.STORE_API_KEY!,
  apiSecretKey: process.env.STORE_API_SECRET_KEY!,
  scopes: ['write_orders'],
  hostName: new URL(process.env.SHOP!).hostname,
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

async function createDemoOrder(productId: string): Promise<void> {
  try {
    const client = new GraphQLClient(
      `${process.env.SHOP}/admin/api/${LATEST_API_VERSION}/graphql.json`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.ACCESS_TOKEN!,
        },
      }
    );

    const mutation = `
      mutation createDraftOrder($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            order {
              id
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        lineItems: [
          {
            variantId: `gid://shopify/ProductVariant/${productId}`,
            quantity: 1,
          },
        ],
        email: 'test@example.com',
        shippingAddress: {
          address1: '123 Test St',
          city: 'Testville',
          province: 'ON',
          country: 'CA',
          zip: 'K2P 1L4',
        },
        customAttributes: [{ key: 'Test Order', value: 'Yes' }],
      },
    };

    const response: any = await client.request(mutation, variables);
    console.log('Demo order created:', JSON.stringify(response, null, 2));

    if (response.draftOrderCreate.userErrors.length > 0) {
      console.error(
        'Errors creating order:',
        response.draftOrderCreate.userErrors
      );
    } else {
      console.log(
        'Draft order created successfully. To complete the order, go to your Shopify admin and mark it as paid.'
      );
    }
  } catch (error) {
    console.error('Error creating demo order:', error);
  }
}

// Usage
const productId = process.argv[2];
if (!productId) {
  console.error('Please provide a product ID as a command-line argument.');
  process.exit(1);
}

createDemoOrder(productId);
