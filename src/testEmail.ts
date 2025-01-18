import dotenv from 'dotenv';
import { sendAlertEmail } from './emailService.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${dirname(__dirname)}/.env` });

async function testEmailService() {
  try {
    const response = await sendAlertEmail('Test Product', 100, 75, 25);
    console.log('Test email sent successfully', response);
  } catch (error: any) {
    console.error('Error sending test email:', error);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
    process.exit(1);
  }
}

testEmailService();
