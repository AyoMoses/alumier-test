# alumier-md Technical Assessment

Might be the longest Readme file I've had to put together. Hope you read and undertsand as I intend. It contains solution for Alumer MD Shopify Task.

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up environment variables: `.env`
   - I will be attaching the .env variables needed to the email. Copy that and paste in the .env file you have created.
4. Sign in to the shopify account I have created to make easier to test task one

### Setting up ngrok for local webhook testing

1. Install ngrok:
   - You need this to run task 3
   - Visit https://ngrok.com/download and follow the installation instructions for your operating system as you need to add the authtoken to allow ngrok run locally on your machine - This should take around 3 minutes max to setup and running.
   - Or use npm to install globally: `npm install -g ngrok`

2. Start your local server and leave it running while you have `npm start` running already in another terminal - you need both for task 3

## Running the Tasks

### Task 1: Custom Sale Badge
- The custom sale badge is implemented in `src/snippets/custom-product-badge.liquid`
- To test, sign in to my shopify account.

### Task 2: Fetch Orders with Specific Product
- Run: `npm run fetch-orders`
- If prompted, enter a product ID
- Alternatively, provide a product ID as an argument: `npm run fetch-orders -- 111111111`

### Task 3: Webhook for Price Changes
- Start the webhook server: `npm start`
- I have created a webhook to listen for Product Update in Shopify notifications
- Update a product's price in Shopify to trigger the webhook

## Testing

- For Task 1: Modify a product's price to see the sale badge in action
- For Task 2: Use the following sample product IDs for testing: [15069290791257, 15069142843737, 15069193765209]


Note: Email notifications are configured to use a fixed email address for security. To test email functionality, modify the `emailService.ts` file with your own email service configuration.


## Assumptions

During the development of this solution, the following assumptions were made:

1. Shopify Store Setup:
   - I have set up a Shopify Partner store for this test

2. Product Data:
   - Products have at least one variant.
   - The first variant's price is used for price change calculations.

3. Order Fetching:
   - The last 30 days is an appropriate timeframe for fetching orders.
   - Fetching up to 250 orders is sufficient (pagination is implemented for larger datasets).

4. Webhook Handling:
   - The server receiving webhooks is publicly accessible or can be made so using ngrok.
   - The Shopify store can send webhooks to the specified endpoint - this webhook was created to handle product change notification.

5. Price Change Alerts:
   - A price decrease of more than 20% is significant enough to trigger an alert (this threshold is configurable).
   - Only price decreases, not increases, trigger alerts.

6. Email Notifications:
   - SendGrid is used as the email service provider.
   - The sender and recipient email addresses are pre-configured for security reasons.

7. Development Environment:
   - Node.js and npm are installed on the development machine.

8. Testing:
   - Running the provided commands to test each task solution
   - Sample product IDs are provided for testing the order fetching functionality.


## Additional Notes
Loads of research had to be done to get things right. Loads of questions. A very interesting task.
