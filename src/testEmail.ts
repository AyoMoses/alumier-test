import dotenv from 'dotenv';
import { sendAlertEmail } from './emailService.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${dirname(__dirname)}/.env` });

async function testEmailService() {
  try {
    await sendAlertEmail('Test Product', 100, 75, 25);
    console.log('Test email sent successfully');
  } catch (error) {
    console.error('Error sending test email:', error);
    process.exit(1);
  }
}

testEmailService();
