import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in the environment variables');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendAlertEmail = async (
  productTitle: string,
  oldPrice: number,
  newPrice: number,
  percentageDecrease: number
) => {
  const msg = {
    to: process.env.EMAIL_TO!,
    from: process.env.EMAIL_FROM!,
    subject: 'Product Price Alert',
    html: `
      <h1>Don't miss the price drop for ${productTitle}</h1>
      <p>The price has decreased by more than ${percentageDecrease.toFixed(
        2
      )}%. Best take advantage</p>
      <ul>
        <li>Old Price: $${oldPrice.toFixed(2)}</li>
        <li>New Price: $${newPrice.toFixed(2)}</li>
        <li>Percentage Decrease: ${percentageDecrease.toFixed(2)}%</li>
      </ul>
    `,
  };

  try {
    const response = await sgMail.send(msg);
    console.log('Alert email sent successfully', response);
    return response;
  } catch (error: any) {
    console.error('Error sending alert email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};
