import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const SHOPIFY_SHOP = process.env.SHOP;
const SHOPIFY_ACCESS_TOKEN = process.env.ACCESS_TOKEN;

if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
  console.error('Error: SHOP and ACCESS_TOKEN must be set in the .env file');
  process.exit(1);
}

const client = new GraphQLClient(
  `https://${SHOPIFY_SHOP}/admin/api/2024-10/graphql.json`,
  {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    },
  }
);

interface OrderProduct {
  id: string;
  title: string;
  quantity: number;
}

interface Order {
  id: string;
  name: string;
  customerName: string;
  createdAt: string;
  products: OrderProduct[];
}

async function fetchOrdersWithProduct(productId: string): Promise<void> {
  try {
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
              customer {
                firstName
                lastName
              }
              lineItems(first: 250) {
                edges {
                  node {
                    product {
                      id
                      title
                    }
                    quantity
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
          customerName: edge.node.customer
            ? `${edge.node.customer.firstName || ''} ${
                edge.node.customer.lastName || ''
              }`.trim() || 'N/A'
            : 'N/A',
          createdAt: edge.node.createdAt,
          products: edge.node.lineItems.edges.map((item: any) => ({
            id: item.node.product?.id || 'N/A',
            title: item.node.product?.title || 'N/A',
            quantity: item.node.quantity,
          })),
        }));

      orders = orders.concat(fetchedOrders);

      hasNextPage = response.orders.pageInfo.hasNextPage;
      cursor = response.orders.pageInfo.endCursor;
    }

    console.log(
      `Found ${orders.length} orders containing the product within the last 30 days:`
    );
    orders.forEach((order) => {
      console.log(`Order ID: ${order.id}`);
      console.log(`Order Number: ${order.name}`);
      console.log(`Customer Name: ${order.customerName}`);
      console.log(`Created At: ${order.createdAt}`);
      console.log('Products:');
      order.products.forEach((product) => {
        console.log(
          `  - ID: ${product.id}, Title: ${product.title}, Quantity: ${product.quantity}`
        );
      });
      console.log('---');
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

function promptForProductId(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Please enter a product ID: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  let productId = process.argv[2];

  if (!productId) {
    productId = await promptForProductId();
  }

  if (!productId) {
    console.error('No product ID provided. Exiting.');
    process.exit(1);
  }

  await fetchOrdersWithProduct(productId);
}

main();
