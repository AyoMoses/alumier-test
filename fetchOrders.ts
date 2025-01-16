import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

const shopify = shopifyApi({
  apiKey: process.env.STORE_API_KEY!,
  apiSecretKey: process.env.STORE_API_SECRET_KEY!,
  scopes: ['read_orders'],
  hostName: process.env.SHOP!,
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
      `https://${process.env.SHOPIFY_SHOP}/admin/api/${LATEST_API_VERSION}/graphql.json`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN!,
        },
      }
    );

    const query = `
      query($cursor: String) {
        orders(first: 250, after: $cursor) {
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
      const response: any = await client.request(query, { cursor });

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

    console.log(`Found ${orders.length} orders containing the product:`);
    orders.forEach((order) => {
      console.log(
        `Order ID: ${order.id}, Order Number: ${order.name}, Created At: ${order.createdAt}`
      );
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
}

// Usage
const productId = process.argv[2];
if (!productId) {
  console.error('Please provide a product ID as a command-line argument.');
  process.exit(1);
}

fetchOrdersWithProduct(productId);
