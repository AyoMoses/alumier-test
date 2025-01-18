import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/.env` });

// Check if required environment variables are set
const requiredEnvVars = [
  'SHOP',
  'ACCESS_TOKEN',
  'STORE_API_KEY',
  'STORE_API_SECRET_KEY',
];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    `Error: Missing required environment variables: ${missingEnvVars.join(
      ', '
    )}`
  );
  process.exit(1);
}

const shopify = shopifyApi({
  apiKey: process.env.STORE_API_KEY!,
  apiSecretKey: process.env.STORE_API_SECRET_KEY!,
  scopes: ['read_orders'],
  hostName: new URL(process.env.SHOP!).hostname,
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

interface Order {
  id: string;
  name: string;
  createdAt: string;
}

async function fetchOrdersWithProduct(productId: string): Promise<void> {
  try {
    const client = new GraphQLClient(
      `${process.env.SHOP}/admin/api/${LATEST_API_VERSION}/graphql.json`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.ACCESS_TOKEN!,
        },
      }
    );

    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const formattedDate = thirtyDaysAgo.toISOString();

    const query = `
      query($cursor: String, $queryString: String!) {
        orders(first: 250, after: $cursor, query: $queryString) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              name
              createdAt
              lineItems(first: 250) {
                edges {
                  node {
                    product {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    let hasNextPage = true;
    let cursor: string | null = null;
    let orders: Order[] = [];

    while (hasNextPage) {
      const variables = {
        cursor: cursor,
        queryString: `created_at:>='${formattedDate}'`,
      };

      const response: any = await client.request(query, variables);

      const fetchedOrders = response.orders.edges
        .filter((edge: any) =>
          edge.node.lineItems.edges.some(
            (item: any) =>
              item.node.product &&
              item.node.product.id === `gid://shopify/Product/${productId}`
          )
        )
        .map((edge: any) => ({
          id: edge.node.id,
          name: edge.node.name,
          createdAt: edge.node.createdAt,
        }));

      orders = orders.concat(fetchedOrders);

      hasNextPage = response.orders.pageInfo.hasNextPage;
      cursor = response.orders.pageInfo.endCursor;
    }

    console.log(
      `Found ${orders.length} orders containing the product within the last 30 days:`
    );
    orders.forEach((order) => {
      console.log(
        `Order ID: ${order.id}, Order Number: ${order.name}, Created At: ${order.createdAt}`
      );
    });

    if (orders.length === 0) {
      console.log(
        `No orders found containing the product with ID: ${productId} within the last 30 days`
      );
      console.log(
        'Please verify that the product ID is correct and exists in your store, and that there are orders within the last 30 days.'
      );
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
}


const productId = process.argv[2];
if (!productId) {
  console.error('Please provide a product ID as a command-line argument.');
  process.exit(1);
}

fetchOrdersWithProduct(productId);
