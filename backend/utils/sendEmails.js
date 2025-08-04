const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or other SMTP (e.g., 'SendGrid', 'Outlook', 'Mailgun')
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Airport Inventory System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: `<strong>${text}</strong>`, 
    });

    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
  }
};

module.exports = sendEmail;
