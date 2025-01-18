import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendAlertEmail = async (
  productTitle: string,
  oldPrice: number,
  newPrice: number,
  percentageDecrease: number
) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject: 'Product Price Alert',
    html: `
      <h1>Price Alert for ${productTitle}</h1>
      <p>The price has decreased by more than 20%.</p>
      <ul>
        <li>Old Price: $${oldPrice.toFixed(2)}</li>
        <li>New Price: $${newPrice.toFixed(2)}</li>
        <li>Percentage Decrease: ${percentageDecrease.toFixed(2)}%</li>
      </ul>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Alert email sent successfully');
  } catch (error) {
    console.error('Error sending alert email:', error);
  }
};
