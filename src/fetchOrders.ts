import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${dirname(__dirname)}/.env` });

// Check if required environment variables are set
const requiredEnvVars = ['SHOP', 'ACCESS_TOKEN'];
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

const client = new GraphQLClient(
  `https://${process.env.SHOP}/admin/api/2024-10/graphql.json`,
  {
    headers: {
      'X-Shopify-Access-Token': process.env.ACCESS_TOKEN!,
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
        queryString: `created_at:>='${formattedDate}' AND line_items.product_id:${productId}`,
      };

      const response: any = await client.request(query, variables);

      const fetchedOrders = response.orders.edges
        .map((edge: any) => ({
          id: edge.node.id,
          name: edge.node.name,
          customerName: edge.node.customer
            ? `${edge.node.customer.firstName || ''} ${
                edge.node.customer.lastName || ''
              }`.trim() || 'N/A'
            : 'N/A',
          createdAt: edge.node.createdAt,
          products: edge.node.lineItems.edges
            .filter(
              (item: any) =>
                item.node.product &&
                item.node.product.id === `gid://shopify/Product/${productId}`
            )
            .map((item: any) => ({
              id: item.node.product.id,
              title: item.node.product.title,
              quantity: item.node.quantity,
            })),
        }))
        .filter((order: Order) => order.products.length > 0);

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

// Usage
const productId = process.argv[2];
if (!productId) {
  console.error('Please provide a product ID as a command-line argument.');
  process.exit(1);
}

fetchOrdersWithProduct(productId);
